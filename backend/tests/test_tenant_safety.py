from decimal import Decimal

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api import admin, public
from app.core.database import Base
from app.models import (
    ContactRequest,
    DeliveryAddress,
    KnowledgeChunk,
    MenuCategory,
    MenuItem,
    Message,
    Order,
    OrderItem,
    OrderStatus,
    Restaurant,
    User,
)
from app.services import chat
from app.schemas import DeliveryAddressCreate, OrderCreate, OrderItemCreate, RestaurantCreate


@pytest.fixture()
def db() -> Session:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    session = TestingSessionLocal()
    try:
        seed_tenant_data(session)
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def seed_tenant_data(db: Session) -> None:
    owner_one = User(email="owner-one@example.com", password_hash="hash", name="Owner One", role="RESTAURANT_OWNER")
    owner_two = User(email="owner-two@example.com", password_hash="hash", name="Owner Two", role="RESTAURANT_OWNER")
    super_admin = User(email="admin@example.com", password_hash="hash", name="Admin", role="SUPER_ADMIN")
    db.add_all([owner_one, owner_two, super_admin])
    db.flush()

    restaurant_one = Restaurant(
        owner_id=owner_one.id,
        name="Tenant One",
        slug="tenant-one",
        description="Tenant one",
        address="One Street",
        city="Berlin",
        phone="111",
        email="one@example.com",
        is_published=True,
    )
    restaurant_two = Restaurant(
        owner_id=owner_two.id,
        name="Tenant Two",
        slug="tenant-two",
        description="Tenant two",
        address="Two Street",
        city="Berlin",
        phone="222",
        email="two@example.com",
        is_published=True,
    )
    db.add_all([restaurant_one, restaurant_two])
    db.flush()

    category_one = MenuCategory(restaurant_id=restaurant_one.id, name="Mains")
    category_two = MenuCategory(restaurant_id=restaurant_two.id, name="Mains")
    db.add_all([category_one, category_two])
    db.flush()
    item_one = MenuItem(category_id=category_one.id, name="Tenant One Pasta", price=Decimal("12.00"), is_available=True)
    item_two = MenuItem(category_id=category_two.id, name="Tenant Two Pasta", price=Decimal("14.00"), is_available=True)
    db.add_all([item_one, item_two])
    db.flush()

    order_one = Order(
        restaurant_id=restaurant_one.id,
        public_id="order-tenant-one",
        order_type="PICKUP",
        status="NEW",
        customer_name="Alice",
        customer_phone="111",
        customer_email="alice@example.com",
        subtotal=Decimal("24.00"),
        delivery_fee=Decimal("0.00"),
        total=Decimal("24.00"),
    )
    order_two = Order(
        restaurant_id=restaurant_two.id,
        public_id="order-tenant-two",
        order_type="PICKUP",
        status="NEW",
        customer_name="Bob",
        customer_phone="222",
        customer_email="bob@example.com",
        subtotal=Decimal("14.00"),
        delivery_fee=Decimal("0.00"),
        total=Decimal("14.00"),
    )
    db.add_all([order_one, order_two])
    db.flush()
    db.add_all(
        [
            OrderItem(order_id=order_one.id, menu_item_id=item_one.id, item_name=item_one.name, unit_price=Decimal("12.00"), quantity=2, line_total=Decimal("24.00")),
            OrderItem(order_id=order_two.id, menu_item_id=item_two.id, item_name=item_two.name, unit_price=Decimal("14.00"), quantity=1, line_total=Decimal("14.00")),
            OrderStatus(order_id=order_one.id, status="NEW", note="Order placed"),
            OrderStatus(order_id=order_two.id, status="NEW", note="Order placed"),
        ]
    )
    db.add_all(
        [
            ContactRequest(restaurant_id=restaurant_one.id, name="Alice", email="alice@example.com", status="new"),
            ContactRequest(restaurant_id=restaurant_two.id, name="Bob", email="bob@example.com", status="new"),
            KnowledgeChunk(restaurant_id=restaurant_one.id, source="menu", content="tenant one vegan pasta special", embedding=None),
            KnowledgeChunk(restaurant_id=restaurant_two.id, source="menu", content="tenant two vegan pasta secret", embedding=None),
        ]
    )
    db.commit()


def users(db: Session) -> tuple[User, User, User]:
    owner_one = db.query(User).filter_by(email="owner-one@example.com").one()
    owner_two = db.query(User).filter_by(email="owner-two@example.com").one()
    super_admin = db.query(User).filter_by(email="admin@example.com").one()
    return owner_one, owner_two, super_admin


def restaurants(db: Session) -> tuple[Restaurant, Restaurant]:
    return db.query(Restaurant).filter_by(slug="tenant-one").one(), db.query(Restaurant).filter_by(slug="tenant-two").one()


def test_owner_can_access_only_own_restaurant(db: Session) -> None:
    owner_one, owner_two, _ = users(db)
    restaurant_one, restaurant_two = restaurants(db)

    assert admin.get_restaurant_for_user(db, restaurant_one.id, owner_one).id == restaurant_one.id
    with pytest.raises(HTTPException) as error:
        admin.get_restaurant_for_user(db, restaurant_two.id, owner_one)
    assert error.value.status_code == 403
    assert admin.get_restaurant_for_user(db, restaurant_two.id, owner_two).id == restaurant_two.id


def test_super_admin_can_access_all_restaurants(db: Session) -> None:
    _, _, super_admin = users(db)
    restaurant_one, restaurant_two = restaurants(db)

    assert admin.get_restaurant_for_user(db, restaurant_one.id, super_admin).id == restaurant_one.id
    assert admin.get_restaurant_for_user(db, restaurant_two.id, super_admin).id == restaurant_two.id


def test_restaurant_owner_can_create_restaurant_only_for_self(db: Session) -> None:
    owner_one, owner_two, _ = users(db)

    created = admin.create_restaurant(
        RestaurantCreate(
            name="Owner One New",
            slug="owner-one-new",
            email="new-owner-one@example.com",
            city="Berlin",
            owner_id=owner_two.id,
        ),
        db=db,
        user=owner_one,
    )

    assert created.owner_id == owner_one.id
    assert created.slug == "owner-one-new"


def test_super_admin_can_assign_new_restaurant_owner(db: Session) -> None:
    owner_one, _, super_admin = users(db)

    created = admin.create_restaurant(
        RestaurantCreate(
            name="Assigned Restaurant",
            slug="assigned-restaurant",
            email="assigned@example.com",
            city="Berlin",
            owner_id=owner_one.id,
        ),
        db=db,
        user=super_admin,
    )

    assert created.owner_id == owner_one.id


def test_orders_are_scoped_to_restaurant_owner(db: Session) -> None:
    owner_one, owner_two, _ = users(db)
    restaurant_one, restaurant_two = restaurants(db)

    owner_one_orders = admin.orders(restaurant_one.id, db=db, user=owner_one)
    assert [order.public_id for order in owner_one_orders] == ["order-tenant-one"]

    with pytest.raises(HTTPException) as error:
        admin.orders(restaurant_two.id, db=db, user=owner_one)
    assert error.value.status_code == 403
    assert [order.public_id for order in admin.orders(restaurant_two.id, db=db, user=owner_two)] == ["order-tenant-two"]


def test_reservations_are_scoped_to_restaurant_owner(db: Session) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, restaurant_two = restaurants(db)

    reservations = admin.reservations(restaurant_one.id, db=db, user=owner_one)
    assert [reservation.email for reservation in reservations] == ["alice@example.com"]

    with pytest.raises(HTTPException) as error:
        admin.reservations(restaurant_two.id, db=db, user=owner_one)
    assert error.value.status_code == 403


def test_public_order_tracking_does_not_leak_across_restaurants(db: Session) -> None:
    assert public.order_tracking("tenant-one", "order-tenant-one", db=db).customer_email == "alice@example.com"

    with pytest.raises(HTTPException) as error:
        public.order_tracking("tenant-one", "order-tenant-two", db=db)
    assert error.value.status_code == 404


def test_public_restaurant_sitemap_source_returns_only_published_restaurants(db: Session) -> None:
    unpublished = Restaurant(
        name="Private Draft",
        slug="private-draft",
        description="Not public yet",
        city="Berlin",
        email="draft@example.com",
        is_published=False,
    )
    db.add(unpublished)
    db.commit()

    summaries = public.public_restaurants(db=db)

    assert {restaurant.slug for restaurant in summaries} == {"tenant-one", "tenant-two"}


def test_public_order_creation_stores_order_and_returns_response(
    db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    restaurant_one, _ = restaurants(db)
    item = (
        db.query(MenuItem)
        .join(MenuCategory)
        .filter(MenuCategory.restaurant_id == restaurant_one.id)
        .first()
    )
    assert item is not None
    monkeypatch.setattr(public, "geocode", lambda _: None)

    order = public.create_order(
        "tenant-one",
        OrderCreate(
            order_type="DELIVERY",
            customer_name="Charlie",
            customer_phone="333",
            customer_email="charlie@example.com",
            notes="Ring twice",
            items=[OrderItemCreate(menu_item_id=item.id, quantity=2, notes="Extra sauce")],
            delivery_address=DeliveryAddressCreate(
                street="Three Street",
                postal_code="10115",
                city="Berlin",
                instructions="Back door",
            ),
        ),
        db=db,
    )

    stored = db.get(Order, order.id)
    assert stored is not None
    assert order.restaurant_id == restaurant_one.id
    assert order.order_type == "DELIVERY"
    assert order.status == "NEW"
    assert order.customer_email == "charlie@example.com"
    assert order.subtotal == Decimal("24.00")
    assert order.delivery_fee == Decimal("3.50")
    assert order.total == Decimal("27.50")
    assert [line.item_name for line in order.items] == [item.name]
    assert order.items[0].quantity == 2
    assert order.items[0].notes == "Extra sauce"
    assert order.delivery_address is not None
    assert order.delivery_address.street == "Three Street"
    assert [status.status for status in order.status_history] == ["NEW"]
    assert db.query(DeliveryAddress).filter_by(order_id=order.id).one().city == "Berlin"


def test_ai_context_retrieval_is_restaurant_scoped(db: Session, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(chat, "create_embeddings", lambda _: [None])

    context = chat.retrieve_context(db, restaurant_id=restaurants(db)[0].id, question="vegan pasta special")

    assert context == ["tenant one vegan pasta special"]
    assert "tenant two vegan pasta secret" not in context
