import logging
from decimal import Decimal

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api import admin, public
from app.core.database import Base
from app.models import (
    Conversation,
    ContactRequest,
    DeliveryAddress,
    DeliveryAssignment,
    DeliveryDriver,
    KnowledgeChunk,
    MenuCategory,
    MenuItem,
    Message,
    Order,
    OrderItem,
    OrderStatus,
    Restaurant,
    RestaurantFaq,
    RestaurantImage,
    User,
)
from app.services import admin_chat, analytics, chat, knowledge, notifications
from app.services import faqs as faq_service
from app.services import menu as menu_service
from app.services import restaurants as restaurant_service
from app.schemas import (
    CategoryCreate,
    ChatRequest,
    ChatResponse,
    CategoryUpdate,
    ContactCreate,
    DeliveryAddressCreate,
    DeliveryAssignmentCreate,
    DeliveryStatusUpdate,
    DriverCreate,
    ImageUrlCreate,
    MenuItemCreate,
    MenuItemUpdate,
    MessageReviewUpdate,
    OrderCreate,
    OrderItemCreate,
    OrderStatusUpdate,
    ReservationStatusUpdate,
    RestaurantCreate,
    RestaurantFaqCreate,
    RestaurantFaqFromMessageCreate,
    RestaurantFaqUpdate,
)


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


def menu_item_for(db: Session, restaurant: Restaurant) -> MenuItem:
    item = (
        db.query(MenuItem)
        .join(MenuCategory)
        .filter(MenuCategory.restaurant_id == restaurant.id)
        .first()
    )
    assert item is not None
    return item


def order_payload(
    item: MenuItem,
    *,
    order_type: str = "PICKUP",
    delivery_address: DeliveryAddressCreate | None = None,
) -> OrderCreate:
    return OrderCreate(
        order_type=order_type,
        customer_name=f"{order_type} Customer",
        customer_phone="333",
        customer_email=f"{order_type.lower().replace('_', '-')}@example.com",
        items=[OrderItemCreate(menu_item_id=item.id, quantity=1)],
        delivery_address=delivery_address,
    )


def delivery_address_payload() -> DeliveryAddressCreate:
    return DeliveryAddressCreate(
        street="Three Street",
        postal_code="10115",
        city="Berlin",
        instructions="Back door",
    )


def reservation_payload() -> ContactCreate:
    return ContactCreate(
        name="Reservation Guest",
        email="guest@example.com",
        phone="333",
        party_size=2,
        requested_at="Friday 19:00",
        message="Window table",
    )


def assigned_delivery_order(
    db: Session,
    restaurant: Restaurant,
    *,
    order_status: str = "READY",
    assignment_status: str = "ASSIGNED",
) -> tuple[Order, DeliveryDriver]:
    order = db.query(Order).filter_by(public_id="order-tenant-one").one()
    order.order_type = "DELIVERY"
    order.status = order_status
    driver = DeliveryDriver(restaurant_id=restaurant.id, name="Mina", phone="555")
    db.add(driver)
    db.flush()
    db.add(
        DeliveryAssignment(
            order_id=order.id,
            driver_id=driver.id,
            status=assignment_status,
        )
    )
    db.commit()
    return order, driver


def test_owner_can_access_only_own_restaurant(db: Session) -> None:
    owner_one, owner_two, _ = users(db)
    restaurant_one, restaurant_two = restaurants(db)

    assert restaurant_service.get_restaurant_for_user(db, restaurant_one.id, owner_one).id == restaurant_one.id
    with pytest.raises(HTTPException) as error:
        restaurant_service.get_restaurant_for_user(db, restaurant_two.id, owner_one)
    assert error.value.status_code == 403
    assert restaurant_service.get_restaurant_for_user(db, restaurant_two.id, owner_two).id == restaurant_two.id


def test_super_admin_can_access_all_restaurants(db: Session) -> None:
    _, _, super_admin = users(db)
    restaurant_one, restaurant_two = restaurants(db)

    assert restaurant_service.get_restaurant_for_user(db, restaurant_one.id, super_admin).id == restaurant_one.id
    assert restaurant_service.get_restaurant_for_user(db, restaurant_two.id, super_admin).id == restaurant_two.id


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


def test_image_url_creation_is_restaurant_scoped(db: Session) -> None:
    owner_one, owner_two, _ = users(db)
    restaurant_one, restaurant_two = restaurants(db)

    image = admin.add_image_url(
        restaurant_one.id,
        ImageUrlCreate(image_type="gallery", url="https://cdn.example.com/dining-room.jpg", alt_text="Dining room"),
        db=db,
        user=owner_one,
    )

    assert image.restaurant_id == restaurant_one.id
    assert image.image_type == "gallery"
    assert db.query(RestaurantImage).filter_by(restaurant_id=restaurant_one.id).count() == 1
    with pytest.raises(HTTPException) as error:
        admin.add_image_url(
            restaurant_two.id,
            ImageUrlCreate(image_type="gallery", url="https://cdn.example.com/private.jpg"),
            db=db,
            user=owner_one,
        )
    assert error.value.status_code == 403
    assert db.query(RestaurantImage).filter_by(restaurant_id=restaurant_two.id).count() == 0
    assert admin.add_image_url(
        restaurant_two.id,
        ImageUrlCreate(image_type="hero", url="https://cdn.example.com/hero.jpg"),
        db=db,
        user=owner_two,
    ).url == "https://cdn.example.com/hero.jpg"


def test_category_management_is_restaurant_scoped(db: Session) -> None:
    owner_one, owner_two, _ = users(db)
    restaurant_one, restaurant_two = restaurants(db)
    category_one = db.query(MenuCategory).filter_by(restaurant_id=restaurant_one.id).one()
    category_two = db.query(MenuCategory).filter_by(restaurant_id=restaurant_two.id).one()

    created = admin.add_category(
        restaurant_one.id,
        CategoryCreate(name="Desserts", description="After dinner", sort_order=3),
        db=db,
        user=owner_one,
    )

    assert created.restaurant_id == restaurant_one.id
    with pytest.raises(HTTPException) as error:
        admin.add_category(
            restaurant_two.id,
            CategoryCreate(name="Private", description="", sort_order=0),
            db=db,
            user=owner_one,
        )
    assert error.value.status_code == 403

    updated = admin.update_category(
        restaurant_one.id,
        category_one.id,
        CategoryUpdate(name="Seasonal Pasta", description="House-made pasta", sort_order=2),
        db=db,
        user=owner_one,
    )

    assert updated.name == "Seasonal Pasta"
    assert updated.description == "House-made pasta"
    assert updated.sort_order == 2
    with pytest.raises(HTTPException) as error:
        admin.update_category(
            restaurant_two.id,
            category_two.id,
            CategoryUpdate(name="Private Menu", description="", sort_order=1),
            db=db,
            user=owner_one,
        )
    assert error.value.status_code == 403
    assert db.get(MenuCategory, category_two.id).name == "Mains"
    with pytest.raises(HTTPException) as error:
        admin.update_category(
            restaurant_one.id,
            category_two.id,
            CategoryUpdate(name="Wrong Tenant", description="", sort_order=1),
            db=db,
            user=owner_one,
        )
    assert error.value.status_code == 404
    assert error.value.detail == "Category not found"

    admin.delete_category(restaurant_one.id, created.id, db=db, user=owner_one)
    assert db.get(MenuCategory, created.id) is None
    with pytest.raises(HTTPException) as error:
        admin.delete_category(restaurant_one.id, category_two.id, db=db, user=owner_one)
    assert error.value.status_code == 404
    assert error.value.detail == "Category not found"


def test_menu_item_create_rejects_category_from_another_restaurant(db: Session) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, restaurant_two = restaurants(db)
    category_two = db.query(MenuCategory).filter_by(restaurant_id=restaurant_two.id).one()

    with pytest.raises(HTTPException) as error:
        admin.add_menu_item(
            restaurant_one.id,
            MenuItemCreate(
                category_id=category_two.id,
                name="Private Pasta",
                description="Wrong restaurant",
                price=Decimal("16.00"),
            ),
            db=db,
            user=owner_one,
        )

    assert error.value.status_code == 404
    assert error.value.detail == "Category not found"
    assert db.query(MenuItem).filter_by(name="Private Pasta").count() == 0


def test_menu_item_update_and_delete_are_restaurant_scoped(db: Session) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, restaurant_two = restaurants(db)
    category_one = db.query(MenuCategory).filter_by(restaurant_id=restaurant_one.id).one()
    item_one = db.query(MenuItem).filter_by(category_id=category_one.id).one()
    item_two = (
        db.query(MenuItem)
        .join(MenuCategory)
        .filter(MenuCategory.restaurant_id == restaurant_two.id)
        .one()
    )

    with pytest.raises(HTTPException) as error:
        admin.update_menu_item(
            restaurant_one.id,
            item_two.id,
            MenuItemUpdate(
                category_id=category_one.id,
                name="Moved Pasta",
                description="Should not cross tenants",
                price=Decimal("18.00"),
            ),
            db=db,
            user=owner_one,
        )
    assert error.value.status_code == 404
    assert error.value.detail == "Menu item not found"
    assert db.get(MenuItem, item_two.id).name == "Tenant Two Pasta"

    updated = admin.update_menu_item(
        restaurant_one.id,
        item_one.id,
        MenuItemUpdate(
            category_id=category_one.id,
            name="Tenant One Ravioli",
            description="Spinach and ricotta",
            price=Decimal("13.00"),
        ),
        db=db,
        user=owner_one,
    )
    assert updated.name == "Tenant One Ravioli"
    assert updated.category_id == category_one.id

    with pytest.raises(HTTPException) as error:
        admin.delete_menu_item(restaurant_one.id, item_two.id, db=db, user=owner_one)
    assert error.value.status_code == 404
    assert error.value.detail == "Menu item not found"

    admin.delete_menu_item(restaurant_one.id, item_one.id, db=db, user=owner_one)
    assert db.get(MenuItem, item_one.id) is None


def test_menu_item_update_preserves_404_for_wrong_restaurant_category(db: Session) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, restaurant_two = restaurants(db)
    category_one = db.query(MenuCategory).filter_by(restaurant_id=restaurant_one.id).one()
    category_two = db.query(MenuCategory).filter_by(restaurant_id=restaurant_two.id).one()
    item_one = db.query(MenuItem).filter_by(category_id=category_one.id).one()

    with pytest.raises(HTTPException) as error:
        admin.update_menu_item(
            restaurant_one.id,
            item_one.id,
            MenuItemUpdate(
                category_id=category_two.id,
                name="Tenant One Pasta",
                description="Wrong category",
                price=Decimal("12.00"),
            ),
            db=db,
            user=owner_one,
        )

    assert error.value.status_code == 404
    assert error.value.detail == "Menu item not found"
    assert db.get(MenuItem, item_one.id).category_id == category_one.id


def test_menu_mutations_rebuild_structured_knowledge_where_expected(
    db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, _ = restaurants(db)
    category = db.query(MenuCategory).filter_by(restaurant_id=restaurant_one.id).one()
    calls: list[int] = []

    def fake_rebuild(_: Session, restaurant_id: int) -> None:
        calls.append(restaurant_id)

    monkeypatch.setattr(menu_service, "rebuild_menu_knowledge", fake_rebuild)

    created_category = admin.add_category(
        restaurant_one.id,
        CategoryCreate(name="Rebuild Check", description="", sort_order=9),
        db=db,
        user=owner_one,
    )
    assert calls == []

    admin.update_category(
        restaurant_one.id,
        created_category.id,
        CategoryUpdate(name="Rebuild Updated", description="", sort_order=9),
        db=db,
        user=owner_one,
    )
    item = admin.add_menu_item(
        restaurant_one.id,
        MenuItemCreate(category_id=category.id, name="Rebuild Pasta", price=Decimal("15.00")),
        db=db,
        user=owner_one,
    )
    admin.update_menu_item(
        restaurant_one.id,
        item.id,
        MenuItemUpdate(category_id=category.id, name="Rebuild Ravioli", price=Decimal("16.00")),
        db=db,
        user=owner_one,
    )
    admin.delete_menu_item(restaurant_one.id, item.id, db=db, user=owner_one)
    admin.delete_category(restaurant_one.id, created_category.id, db=db, user=owner_one)

    assert calls == [restaurant_one.id] * 5


def test_orders_are_scoped_to_restaurant_owner(db: Session) -> None:
    owner_one, owner_two, _ = users(db)
    restaurant_one, restaurant_two = restaurants(db)

    owner_one_orders = admin.orders(restaurant_one.id, db=db, user=owner_one)
    assert [order.public_id for order in owner_one_orders] == ["order-tenant-one"]

    with pytest.raises(HTTPException) as error:
        admin.orders(restaurant_two.id, db=db, user=owner_one)
    assert error.value.status_code == 403
    assert [order.public_id for order in admin.orders(restaurant_two.id, db=db, user=owner_two)] == ["order-tenant-two"]


def test_order_listing_preserves_status_and_order_type_filters(db: Session) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, _ = restaurants(db)
    db.add(
        Order(
            restaurant_id=restaurant_one.id,
            public_id="order-filter-ready",
            order_type="DELIVERY",
            status="READY",
            customer_name="Charlie",
            customer_phone="333",
            customer_email="charlie@example.com",
            subtotal=Decimal("18.00"),
            delivery_fee=Decimal("3.50"),
            total=Decimal("21.50"),
        )
    )
    db.commit()

    ready_orders = admin.orders(restaurant_one.id, status="ready", db=db, user=owner_one)
    assert [order.public_id for order in ready_orders] == ["order-filter-ready"]

    delivery_orders = admin.orders(
        restaurant_one.id, order_type="delivery", db=db, user=owner_one
    )
    assert [order.public_id for order in delivery_orders] == ["order-filter-ready"]

    pickup_orders = admin.orders(
        restaurant_one.id, order_type="pickup", db=db, user=owner_one
    )
    assert [order.public_id for order in pickup_orders] == ["order-tenant-one"]


def test_wrong_or_missing_restaurant_order_update_returns_404(db: Session) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, restaurant_two = restaurants(db)
    other_order = db.query(Order).filter_by(restaurant_id=restaurant_two.id).one()

    for order_id in [other_order.id, 9999]:
        with pytest.raises(HTTPException) as error:
            admin.update_order(
                restaurant_one.id,
                order_id,
                OrderStatusUpdate(status="ACCEPTED", estimated_minutes=20),
                db=db,
                user=owner_one,
            )
        assert error.value.status_code == 404
        assert error.value.detail == "Order not found"


def test_valid_order_status_transition_updates_history(db: Session) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, _ = restaurants(db)
    order = db.query(Order).filter_by(public_id="order-tenant-one").one()

    updated = admin.update_order(
        restaurant_one.id,
        order.id,
        OrderStatusUpdate(status="ACCEPTED", estimated_minutes=25),
        db=db,
        user=owner_one,
    )

    assert updated.status == "ACCEPTED"
    assert updated.estimated_minutes == 25
    assert ("ACCEPTED", "") in [
        (status.status, status.note) for status in updated.status_history
    ]


def test_invalid_order_status_transition_is_rejected(db: Session) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, _ = restaurants(db)
    order = db.query(Order).filter_by(public_id="order-tenant-one").one()

    with pytest.raises(HTTPException) as error:
        admin.update_order(
            restaurant_one.id,
            order.id,
            OrderStatusUpdate(status="DELIVERED"),
            db=db,
            user=owner_one,
        )

    assert error.value.status_code == 400
    assert error.value.detail == "Cannot move order from NEW to DELIVERED"
    assert order.status == "NEW"
    assert [status.status for status in order.status_history] == ["NEW"]


def test_rejected_order_status_transition_stores_rejection_note(db: Session) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, _ = restaurants(db)
    order = db.query(Order).filter_by(public_id="order-tenant-one").one()

    updated = admin.update_order(
        restaurant_one.id,
        order.id,
        OrderStatusUpdate(status="REJECTED", rejection_reason="Kitchen is closed"),
        db=db,
        user=owner_one,
    )

    assert updated.status == "REJECTED"
    assert updated.rejection_reason == "Kitchen is closed"
    assert ("REJECTED", "Kitchen is closed") in [
        (status.status, status.note) for status in updated.status_history
    ]


def test_delivery_assignment_status_follows_order_status_transition(db: Session) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, _ = restaurants(db)
    order = db.query(Order).filter_by(public_id="order-tenant-one").one()
    order.status = "READY"
    driver = DeliveryDriver(restaurant_id=restaurant_one.id, name="Mina", phone="555")
    db.add(driver)
    db.flush()
    assignment = DeliveryAssignment(order_id=order.id, driver_id=driver.id)
    db.add(assignment)
    db.commit()

    delivering = admin.update_order(
        restaurant_one.id,
        order.id,
        OrderStatusUpdate(status="DELIVERING"),
        db=db,
        user=owner_one,
    )
    assert delivering.delivery_assignment.status == "ON_THE_WAY"

    delivered = admin.update_order(
        restaurant_one.id,
        order.id,
        OrderStatusUpdate(status="DELIVERED"),
        db=db,
        user=owner_one,
    )
    assert delivered.delivery_assignment.status == "DELIVERED"


def test_driver_management_is_restaurant_scoped(db: Session) -> None:
    owner_one, owner_two, _ = users(db)
    restaurant_one, restaurant_two = restaurants(db)

    driver = admin.create_driver(
        restaurant_one.id,
        DriverCreate(name="Zara", phone="123"),
        db=db,
        user=owner_one,
    )

    assert driver.restaurant_id == restaurant_one.id
    assert [driver.name for driver in admin.drivers(restaurant_one.id, db=db, user=owner_one)] == ["Zara"]
    assert admin.drivers(restaurant_two.id, db=db, user=owner_two) == []
    with pytest.raises(HTTPException) as error:
        admin.drivers(restaurant_two.id, db=db, user=owner_one)
    assert error.value.status_code == 403
    with pytest.raises(HTTPException) as error:
        admin.create_driver(
            restaurant_two.id,
            DriverCreate(name="Private Driver", phone="222"),
            db=db,
            user=owner_one,
        )
    assert error.value.status_code == 403


def test_assigning_active_driver_creates_and_updates_delivery_assignment(db: Session) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, _ = restaurants(db)
    order = db.query(Order).filter_by(public_id="order-tenant-one").one()
    order.order_type = "DELIVERY"
    db.commit()
    first_driver = admin.create_driver(
        restaurant_one.id,
        DriverCreate(name="Mina", phone="555"),
        db=db,
        user=owner_one,
    )
    second_driver = admin.create_driver(
        restaurant_one.id,
        DriverCreate(name="Omar", phone="777"),
        db=db,
        user=owner_one,
    )

    assigned = admin.assign_driver(
        restaurant_one.id,
        order.id,
        DeliveryAssignmentCreate(driver_id=first_driver.id),
        db=db,
        user=owner_one,
    )
    assert assigned.id == order.id
    assignment = db.query(DeliveryAssignment).filter_by(order_id=order.id).one()
    assignment_id = assignment.id
    assert assignment.driver_id == first_driver.id
    assert assignment.status == "ASSIGNED"
    db.expire_all()

    reassigned = admin.assign_driver(
        restaurant_one.id,
        order.id,
        DeliveryAssignmentCreate(driver_id=second_driver.id),
        db=db,
        user=owner_one,
    )
    assert reassigned.id == order.id
    updated_assignment = db.get(DeliveryAssignment, assignment_id)
    assert updated_assignment.driver_id == second_driver.id
    assert updated_assignment.status == "ASSIGNED"


def test_assigning_wrong_restaurant_or_inactive_driver_returns_driver_not_found(db: Session) -> None:
    owner_one, owner_two, _ = users(db)
    restaurant_one, restaurant_two = restaurants(db)
    order = db.query(Order).filter_by(public_id="order-tenant-one").one()
    order.order_type = "DELIVERY"
    inactive_driver = DeliveryDriver(
        restaurant_id=restaurant_one.id,
        name="Inactive Driver",
        phone="000",
        is_active=False,
    )
    wrong_restaurant_driver = admin.create_driver(
        restaurant_two.id,
        DriverCreate(name="Private Driver", phone="222"),
        db=db,
        user=owner_two,
    )
    db.add(inactive_driver)
    db.commit()

    for driver_id in [wrong_restaurant_driver.id, inactive_driver.id]:
        with pytest.raises(HTTPException) as error:
            admin.assign_driver(
                restaurant_one.id,
                order.id,
                DeliveryAssignmentCreate(driver_id=driver_id),
                db=db,
                user=owner_one,
            )
        assert error.value.status_code == 404
        assert error.value.detail == "Driver not found"


def test_invalid_delivery_status_is_rejected(db: Session) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, _ = restaurants(db)
    order, _ = assigned_delivery_order(db, restaurant_one)

    with pytest.raises(HTTPException) as error:
        admin.update_delivery_status(
            restaurant_one.id,
            order.id,
            DeliveryStatusUpdate(status="LOST"),
            db=db,
            user=owner_one,
        )

    assert error.value.status_code == 400
    assert error.value.detail == "Invalid delivery status"


def test_delivery_status_updates_order_status_and_history(db: Session) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, _ = restaurants(db)
    order, _ = assigned_delivery_order(db, restaurant_one)

    on_the_way = admin.update_delivery_status(
        restaurant_one.id,
        order.id,
        DeliveryStatusUpdate(status="ON_THE_WAY"),
        db=db,
        user=owner_one,
    )
    assert on_the_way.status == "DELIVERING"
    assert on_the_way.delivery_assignment.status == "ON_THE_WAY"
    assert ("DELIVERING", "Driver status: ON_THE_WAY") in [
        (status.status, status.note) for status in on_the_way.status_history
    ]
    db.expire_all()

    delivered = admin.update_delivery_status(
        restaurant_one.id,
        order.id,
        DeliveryStatusUpdate(status="DELIVERED"),
        db=db,
        user=owner_one,
    )
    assert delivered.status == "DELIVERED"
    assert delivered.delivery_assignment.status == "DELIVERED"
    status_history = db.query(OrderStatus).filter_by(order_id=order.id).all()
    assert ("DELIVERED", "Driver status: DELIVERED") in [
        (status.status, status.note) for status in status_history
    ]


def test_deleting_driver_with_active_delivery_is_rejected(db: Session) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, _ = restaurants(db)
    _, driver = assigned_delivery_order(db, restaurant_one)

    with pytest.raises(HTTPException) as error:
        admin.delete_driver(restaurant_one.id, driver.id, db=db, user=owner_one)

    assert error.value.status_code == 409
    assert error.value.detail == "Driver has an active delivery"
    assert db.get(DeliveryDriver, driver.id) is not None


def test_reservations_are_scoped_to_restaurant_owner(db: Session) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, restaurant_two = restaurants(db)

    reservations = admin.reservations(restaurant_one.id, db=db, user=owner_one)
    assert [reservation.email for reservation in reservations] == ["alice@example.com"]

    with pytest.raises(HTTPException) as error:
        admin.reservations(restaurant_two.id, db=db, user=owner_one)
    assert error.value.status_code == 403


def test_reservation_status_update_is_scoped_and_preserves_not_found(db: Session) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, restaurant_two = restaurants(db)
    reservation_one = db.query(ContactRequest).filter_by(restaurant_id=restaurant_one.id).one()
    reservation_two = db.query(ContactRequest).filter_by(restaurant_id=restaurant_two.id).one()

    updated = admin.update_reservation(
        restaurant_one.id,
        reservation_one.id,
        ReservationStatusUpdate(status="confirmed"),
        db=db,
        user=owner_one,
    )

    assert updated.status == "confirmed"
    assert db.get(ContactRequest, reservation_two.id).status == "new"
    for reservation_id in [reservation_two.id, 9999]:
        with pytest.raises(HTTPException) as error:
            admin.update_reservation(
                restaurant_one.id,
                reservation_id,
                ReservationStatusUpdate(status="cancelled"),
                db=db,
                user=owner_one,
            )
        assert error.value.status_code == 404
        assert error.value.detail == "Reservation not found"


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


def test_public_order_rejected_when_ordering_disabled(db: Session) -> None:
    restaurant_one, _ = restaurants(db)
    item = menu_item_for(db, restaurant_one)
    restaurant_one.ordering_enabled = False
    db.commit()

    with pytest.raises(HTTPException) as error:
        public.create_order("tenant-one", order_payload(item), db=db)

    assert error.value.status_code == 400
    assert error.value.detail == "Online ordering is disabled for this restaurant"
    assert db.query(Order).filter_by(customer_name="PICKUP Customer").count() == 0


@pytest.mark.parametrize(
    ("flag_name", "order_type", "expected_detail"),
    [
        ("pickup_enabled", "PICKUP", "Pickup ordering is disabled for this restaurant"),
        ("dine_in_enabled", "EAT_IN", "Dine-in ordering is disabled for this restaurant"),
        ("dine_in_enabled", "DINE_IN", "Dine-in ordering is disabled for this restaurant"),
        ("delivery_enabled", "DELIVERY", "Delivery ordering is disabled for this restaurant"),
    ],
)
def test_public_order_rejected_when_selected_service_mode_is_disabled(
    db: Session,
    flag_name: str,
    order_type: str,
    expected_detail: str,
) -> None:
    restaurant_one, _ = restaurants(db)
    item = menu_item_for(db, restaurant_one)
    setattr(restaurant_one, flag_name, False)
    db.commit()

    payload = order_payload(
        item,
        order_type=order_type,
        delivery_address=delivery_address_payload() if order_type == "DELIVERY" else None,
    )
    with pytest.raises(HTTPException) as error:
        public.create_order("tenant-one", payload, db=db)

    assert error.value.status_code == 400
    assert error.value.detail == expected_detail


def test_public_delivery_order_still_requires_address_when_delivery_is_enabled(db: Session) -> None:
    restaurant_one, _ = restaurants(db)
    item = menu_item_for(db, restaurant_one)
    restaurant_one.delivery_enabled = True
    db.commit()

    with pytest.raises(HTTPException) as error:
        public.create_order("tenant-one", order_payload(item, order_type="DELIVERY"), db=db)

    assert error.value.status_code == 400
    assert error.value.detail == "Delivery address is required"


@pytest.mark.parametrize(
    ("requested_order_type", "stored_order_type"),
    [
        ("PICKUP", "PICKUP"),
        ("EAT_IN", "EAT_IN"),
        ("DINE_IN", "EAT_IN"),
    ],
)
def test_public_pickup_and_dine_in_orders_still_work_when_enabled(
    db: Session,
    requested_order_type: str,
    stored_order_type: str,
) -> None:
    restaurant_one, _ = restaurants(db)
    item = menu_item_for(db, restaurant_one)

    order = public.create_order(
        "tenant-one",
        order_payload(item, order_type=requested_order_type),
        db=db,
    )

    assert order.restaurant_id == restaurant_one.id
    assert order.order_type == stored_order_type
    assert order.status == "NEW"
    assert order.subtotal == Decimal("12.00")
    assert order.delivery_fee == Decimal("0.00")
    assert order.delivery_address is None
    assert [line.item_name for line in order.items] == [item.name]


def test_public_order_creation_stores_order_and_returns_response(
    db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    restaurant_one, _ = restaurants(db)
    item = menu_item_for(db, restaurant_one)
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


def test_public_order_creation_triggers_notification_after_success(
    db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    restaurant_one, _ = restaurants(db)
    item = menu_item_for(db, restaurant_one)
    sent_messages: list[tuple[str, str]] = []
    monkeypatch.setattr(notifications.settings, "smtp_host", "smtp.example.com")
    monkeypatch.setattr(notifications.settings, "smtp_from_email", "orders@example.com")
    monkeypatch.setattr(notifications.settings, "notification_to_email", "owner@example.com")
    monkeypatch.setattr(notifications.settings, "admin_base_url", "https://admin.example.com")

    def fake_send_email(config: object, subject: str, body: str) -> None:
        sent_messages.append((subject, body))

    monkeypatch.setattr(notifications, "send_email", fake_send_email)

    order = public.create_order("tenant-one", order_payload(item), db=db)

    assert len(sent_messages) == 1
    subject, body = sent_messages[0]
    assert subject == "New order for Tenant One"
    assert "Restaurant: Tenant One" in body
    assert "Type: New public order" in body
    assert "Customer name: PICKUP Customer" in body
    assert "Customer email: pickup@example.com" in body
    assert "Customer phone: 333" in body
    assert "Order mode: PICKUP" in body
    assert f"Public order ID: {order.public_id}" in body
    assert "Total: EUR 12.00" in body
    assert "Admin: https://admin.example.com/admin/restaurants/" in body


def test_public_order_creation_does_not_fail_when_notification_config_is_missing(
    db: Session, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    restaurant_one, _ = restaurants(db)
    item = menu_item_for(db, restaurant_one)
    monkeypatch.setattr(notifications.settings, "smtp_host", "")
    monkeypatch.setattr(notifications.settings, "smtp_from_email", "")
    monkeypatch.setattr(notifications.settings, "notification_to_email", "")

    with caplog.at_level(logging.INFO, logger="restaurantai.notifications"):
        order = public.create_order("tenant-one", order_payload(item), db=db)

    assert order.status == "NEW"
    assert "Skipping order email notification" in caplog.text
    assert "SMTP_HOST" in caplog.text


def test_public_order_creation_does_not_fail_when_notification_send_fails(
    db: Session, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    restaurant_one, _ = restaurants(db)
    item = menu_item_for(db, restaurant_one)
    monkeypatch.setattr(notifications.settings, "smtp_host", "smtp.example.com")
    monkeypatch.setattr(notifications.settings, "smtp_from_email", "orders@example.com")
    monkeypatch.setattr(notifications.settings, "notification_to_email", "owner@example.com")

    def fail_send(*_: object) -> None:
        raise RuntimeError("SMTP unavailable")

    monkeypatch.setattr(notifications, "send_email", fail_send)

    with caplog.at_level(logging.ERROR, logger="restaurantai.notifications"):
        order = public.create_order("tenant-one", order_payload(item), db=db)

    assert order.status == "NEW"
    assert "Failed to send order email notification" in caplog.text


def test_public_reservation_rejected_when_reservations_disabled(db: Session) -> None:
    restaurant_one, _ = restaurants(db)
    restaurant_one.reservations_enabled = False
    db.commit()

    with pytest.raises(HTTPException) as error:
        public.create_reservation("tenant-one", reservation_payload(), db=db)

    assert error.value.status_code == 400
    assert error.value.detail == "Reservations are disabled for this restaurant"
    assert db.query(ContactRequest).filter_by(name="Reservation Guest").count() == 0


def test_legacy_contact_rejected_when_reservations_disabled(db: Session) -> None:
    restaurant_one, _ = restaurants(db)
    restaurant_one.reservations_enabled = False
    db.commit()

    with pytest.raises(HTTPException) as error:
        public.legacy_contact(reservation_payload(), db=db)

    assert error.value.status_code == 400
    assert error.value.detail == "Reservations are disabled for this restaurant"
    assert db.query(ContactRequest).filter_by(name="Reservation Guest").count() == 0


def test_public_reservation_still_works_when_enabled(db: Session) -> None:
    restaurant_one, _ = restaurants(db)

    request = public.create_reservation("tenant-one", reservation_payload(), db=db)

    assert request.restaurant_id == restaurant_one.id
    assert request.name == "Reservation Guest"
    assert request.email == "guest@example.com"
    assert request.party_size == 2
    assert request.status == "new"


def test_public_reservation_creation_triggers_notification_after_success(
    db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    sent_messages: list[tuple[str, str]] = []
    monkeypatch.setattr(notifications.settings, "smtp_host", "smtp.example.com")
    monkeypatch.setattr(notifications.settings, "smtp_from_email", "orders@example.com")
    monkeypatch.setattr(notifications.settings, "notification_to_email", "owner@example.com")
    monkeypatch.setattr(notifications.settings, "admin_base_url", "https://admin.example.com")

    def fake_send_email(config: object, subject: str, body: str) -> None:
        sent_messages.append((subject, body))

    monkeypatch.setattr(notifications, "send_email", fake_send_email)

    request = public.create_reservation("tenant-one", reservation_payload(), db=db)

    assert len(sent_messages) == 1
    subject, body = sent_messages[0]
    assert subject == "New reservation request for Tenant One"
    assert "Restaurant: Tenant One" in body
    assert "Type: New reservation/contact request" in body
    assert f"Customer name: {request.name}" in body
    assert "Customer email: guest@example.com" in body
    assert "Customer phone: 333" in body
    assert "Requested date/time: Friday 19:00" in body
    assert "Party size: 2" in body
    assert "Message: Window table" in body
    assert "Admin: https://admin.example.com/admin/restaurants/" in body


def test_legacy_contact_creation_triggers_notification_after_success(
    db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    notifications_sent: list[tuple[str, str]] = []

    def fake_notify(restaurant: Restaurant, request: ContactRequest) -> bool:
        notifications_sent.append((restaurant.slug, request.email))
        return True

    monkeypatch.setattr(public, "notify_new_contact_request", fake_notify)

    public.legacy_contact(reservation_payload(), db=db)

    assert notifications_sent == [("tenant-one", "guest@example.com")]


def test_ai_context_retrieval_is_restaurant_scoped(db: Session, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(chat, "create_embeddings", lambda _: [None])

    context = chat.retrieve_context(db, restaurant_id=restaurants(db)[0].id, question="vegan pasta special")

    assert context == ["tenant one vegan pasta special"]
    assert "tenant two vegan pasta secret" not in context


def test_structured_ai_knowledge_includes_services_menu_and_allergens(
    db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    restaurant_one, _ = restaurants(db)
    category = db.query(MenuCategory).filter_by(restaurant_id=restaurant_one.id).one()
    item = db.query(MenuItem).filter_by(category_id=category.id).one()
    restaurant_one.story = "A handmade pasta counter with a quiet dining room."
    restaurant_one.opening_hours = '{"friday":"12:00-22:00"}'
    restaurant_one.reservation_url = "https://booking.example/tenant-one"
    restaurant_one.delivery_enabled = True
    restaurant_one.pickup_enabled = True
    item.description = "Fresh pasta with basil."
    item.allergens = "gluten"
    item.is_vegetarian = True
    monkeypatch.setattr(knowledge, "create_embeddings", lambda texts: [None] * len(texts))

    knowledge.rebuild_structured_knowledge(db, restaurant_one.id)

    chunks = [
        chunk.content
        for chunk in db.query(KnowledgeChunk)
        .filter(KnowledgeChunk.restaurant_id == restaurant_one.id)
        .all()
    ]
    combined = "\n".join(chunks)
    assert "Story and atmosphere: A handmade pasta counter" in combined
    assert "Available customer service modes" in combined
    assert "Delivery enabled: yes" in combined
    assert "Price: EUR 12.00" in combined
    assert "Allergens: gluten" in combined
    assert "Dietary options: vegetarian" in combined


def test_public_ai_fallback_hides_openai_setup_details_when_key_is_missing(
    db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    restaurant_one, _ = restaurants(db)
    restaurant_one.ai_name = "Tenant AI"
    restaurant_one.ai_escalation_message = "Call Tenant One directly."
    db.commit()
    monkeypatch.setattr(chat.settings, "openai_api_key", "")

    result = chat.answer_question(db, restaurant_one.id, "Do you deliver tonight?")

    assert result.answer == (
        "Our AI assistant is temporarily unavailable. You can still browse the menu, "
        "place an order, or contact the restaurant directly."
    )
    assert result.unanswered is True
    assert result.sources == []


def test_admin_ai_test_can_show_openai_setup_guidance_when_key_is_missing(
    db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    restaurant_one, _ = restaurants(db)
    monkeypatch.setattr(chat.settings, "openai_api_key", "")

    result = chat.answer_question(
        db,
        restaurant_one.id,
        "Do you deliver tonight?",
        include_setup_details=True,
    )

    assert "Set OPENAI_API_KEY" in result.answer
    assert result.unanswered is True
    assert result.sources == []


def test_public_chat_response_includes_ai_sources(
    db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    restaurant_one, _ = restaurants(db)

    def fake_answer(
        _: Session,
        restaurant_id: int,
        question: str,
        include_setup_details: bool = False,
    ) -> chat.ChatAnswer:
        assert restaurant_id == restaurant_one.id
        assert question == "What pasta is available?"
        assert include_setup_details is False
        return chat.ChatAnswer("Tenant One Pasta is available.", False, ["menu"])

    monkeypatch.setattr(public, "answer_question", fake_answer)

    response = public.restaurant_chat(
        "tenant-one",
        ChatRequest(message="What pasta is available?"),
        db=db,
    )

    assert response.answer == "Tenant One Pasta is available."
    assert response.unanswered is False
    assert response.sources == ["menu"]


def test_restaurant_owner_can_manage_faq_knowledge(db: Session) -> None:
    owner_one, owner_two, _ = users(db)
    restaurant_one, restaurant_two = restaurants(db)

    faq = admin.create_faq(
        restaurant_one.id,
        RestaurantFaqCreate(
            question="Do you offer private dining?",
            answer="Private dining is available by request.",
            sort_order=0,
        ),
        db=db,
        user=owner_one,
    )

    assert faq.restaurant_id == restaurant_one.id
    assert faq.is_active is True
    assert [item.id for item in admin.faqs(restaurant_one.id, db=db, user=owner_one)] == [faq.id]
    with pytest.raises(HTTPException) as error:
        admin.faqs(restaurant_two.id, db=db, user=owner_one)
    assert error.value.status_code == 403
    assert "Private dining is available" in "\n".join(
        chunk.content
        for chunk in db.query(KnowledgeChunk)
        .filter(KnowledgeChunk.restaurant_id == restaurant_one.id)
        .all()
    )

    updated = admin.update_faq(
        restaurant_one.id,
        faq.id,
        RestaurantFaqUpdate(
            question="Do you offer private dining?",
            answer="Private dining is available for groups after calling the restaurant.",
            is_active=True,
            sort_order=1,
        ),
        db=db,
        user=owner_one,
    )
    assert updated.sort_order == 1
    assert "groups after calling" in updated.answer

    other_faq = admin.create_faq(
        restaurant_two.id,
        RestaurantFaqCreate(question="Tenant two only?", answer="Yes.", sort_order=0),
        db=db,
        user=owner_two,
    )
    with pytest.raises(HTTPException) as error:
        admin.update_faq(
            restaurant_one.id,
            other_faq.id,
            RestaurantFaqUpdate(
                question="Wrong tenant?",
                answer="This should not update.",
                is_active=True,
                sort_order=0,
            ),
            db=db,
            user=owner_one,
        )
    assert error.value.status_code == 404
    assert error.value.detail == "FAQ not found"
    with pytest.raises(HTTPException) as error:
        admin.delete_faq(restaurant_one.id, other_faq.id, db=db, user=owner_one)
    assert error.value.status_code == 404
    assert error.value.detail == "FAQ not found"
    assert db.get(RestaurantFaq, other_faq.id).answer == "Yes."

    with pytest.raises(HTTPException) as error:
        admin.create_faq(
            restaurant_two.id,
            RestaurantFaqCreate(question="Private", answer="Tenant leak"),
            db=db,
            user=owner_one,
        )
    assert error.value.status_code == 403

    admin.delete_faq(restaurant_one.id, faq.id, db=db, user=owner_one)
    assert db.get(RestaurantFaq, faq.id) is None
    assert [item.id for item in admin.faqs(restaurant_two.id, db=db, user=owner_two)] == [other_faq.id]


def test_faq_mutations_rebuild_structured_knowledge_where_expected(
    db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, _ = restaurants(db)
    calls: list[int] = []

    def fake_rebuild(_: Session, restaurant_id: int) -> None:
        calls.append(restaurant_id)

    monkeypatch.setattr(faq_service, "rebuild_faq_knowledge", fake_rebuild)

    faq = admin.create_faq(
        restaurant_one.id,
        RestaurantFaqCreate(question="Do you have tasting menus?", answer="Yes.", sort_order=0),
        db=db,
        user=owner_one,
    )
    admin.update_faq(
        restaurant_one.id,
        faq.id,
        RestaurantFaqUpdate(
            question="Do you have tasting menus?",
            answer="Yes, with advance notice.",
            is_active=True,
            sort_order=1,
        ),
        db=db,
        user=owner_one,
    )
    admin.delete_faq(restaurant_one.id, faq.id, db=db, user=owner_one)

    assert calls == [restaurant_one.id] * 3


def test_reviewing_unanswered_message_removes_ai_gap_count(db: Session) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, _ = restaurants(db)
    conversation = Conversation(restaurant_id=restaurant_one.id)
    db.add(conversation)
    db.flush()
    db.add_all(
        [
            Message(conversation_id=conversation.id, role="user", content="Do you have nut-free desserts?"),
            Message(
                conversation_id=conversation.id,
                role="assistant",
                content="I don't have this information.",
                is_unanswered=True,
            ),
        ]
    )
    db.commit()
    message = db.query(Message).filter_by(role="assistant").one()

    assert analytics.build_restaurant_overview(db, restaurant_one).unanswered_count == 1

    reviewed = admin.review_unanswered_message(
        restaurant_one.id,
        message.id,
        MessageReviewUpdate(is_reviewed=True),
        db=db,
        user=owner_one,
    )

    assert reviewed.is_reviewed is True
    assert analytics.build_restaurant_overview(db, restaurant_one).unanswered_count == 0


def test_reviewing_unanswered_message_preserves_missing_and_non_unanswered_errors(
    db: Session,
) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, restaurant_two = restaurants(db)
    wrong_restaurant_conversation = Conversation(restaurant_id=restaurant_two.id)
    conversation = Conversation(restaurant_id=restaurant_one.id)
    db.add_all([wrong_restaurant_conversation, conversation])
    db.flush()
    wrong_restaurant_message = Message(
        conversation_id=wrong_restaurant_conversation.id,
        role="assistant",
        content="I don't have this information.",
        is_unanswered=True,
    )
    answered_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content="We have already answered this.",
        is_unanswered=False,
    )
    db.add_all([wrong_restaurant_message, answered_message])
    db.commit()

    for message_id in [wrong_restaurant_message.id, 9999]:
        with pytest.raises(HTTPException) as error:
            admin.review_unanswered_message(
                restaurant_one.id,
                message_id,
                MessageReviewUpdate(is_reviewed=True),
                db=db,
                user=owner_one,
            )
        assert error.value.status_code == 404
        assert error.value.detail == "Unanswered message not found"

    with pytest.raises(HTTPException) as error:
        admin.review_unanswered_message(
            restaurant_one.id,
            answered_message.id,
            MessageReviewUpdate(is_reviewed=True),
            db=db,
            user=owner_one,
        )
    assert error.value.status_code == 400
    assert error.value.detail == "Message is not marked unanswered"


def test_unanswered_question_can_be_converted_to_faq(db: Session) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, _ = restaurants(db)
    conversation = Conversation(restaurant_id=restaurant_one.id)
    db.add(conversation)
    db.flush()
    db.add_all(
        [
            Message(conversation_id=conversation.id, role="user", content="Can you make desserts nut-free?"),
            Message(
                conversation_id=conversation.id,
                role="assistant",
                content="I don't have this information.",
                is_unanswered=True,
            ),
        ]
    )
    db.commit()
    message = db.query(Message).filter_by(role="assistant").one()

    faq = admin.convert_unanswered_message_to_faq(
        restaurant_one.id,
        message.id,
        RestaurantFaqFromMessageCreate(
            question="Can you make desserts nut-free?",
            answer="Guests should call before ordering desserts with nut allergies.",
            is_active=True,
            sort_order=0,
        ),
        db=db,
        user=owner_one,
    )

    assert faq.source_message_id == message.id
    assert db.get(Message, message.id).is_reviewed is True
    assert "nut allergies" in "\n".join(
        chunk.content
        for chunk in db.query(KnowledgeChunk)
        .filter(KnowledgeChunk.restaurant_id == restaurant_one.id)
        .all()
    )


def test_admin_ai_test_conversations_are_separate_from_public_customer_conversations(
    db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, _ = restaurants(db)
    public_conversation = Conversation(restaurant_id=restaurant_one.id)
    db.add(public_conversation)
    db.commit()

    def fake_answer(
        _: Session,
        restaurant_id: int,
        question: str,
        include_setup_details: bool = False,
    ) -> chat.ChatAnswer:
        assert restaurant_id == restaurant_one.id
        assert question == "What should I order?"
        assert include_setup_details is True
        return chat.ChatAnswer("Order Tenant One Pasta.", False, ["menu"])

    monkeypatch.setattr(public, "answer_question", fake_answer)

    response = admin.test_ai_response(
        restaurant_one.id,
        ChatRequest(message="What should I order?"),
        db=db,
        user=owner_one,
    )

    assert response.answer == "Order Tenant One Pasta."
    assert db.query(Conversation).filter_by(restaurant_id=restaurant_one.id, is_test=True).count() == 1
    default_conversations = admin.conversations(restaurant_one.id, include_test=False, db=db, user=owner_one)
    assert [conversation.id for conversation in default_conversations] == [public_conversation.id]
    all_conversations = admin.conversations(restaurant_one.id, include_test=True, db=db, user=owner_one)
    assert len(all_conversations) == 2
    assert any(conversation.is_test for conversation in all_conversations)


def test_admin_ai_test_route_shows_setup_guidance_when_key_is_missing(
    db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    owner_one, _, _ = users(db)
    restaurant_one, _ = restaurants(db)
    monkeypatch.setattr(chat.settings, "openai_api_key", "")

    response = admin.test_ai_response(
        restaurant_one.id,
        ChatRequest(message="Do you deliver tonight?"),
        db=db,
        user=owner_one,
    )

    assert "Set OPENAI_API_KEY" in response.answer
    assert response.unanswered is True
    assert response.sources == []


def test_admin_chat_service_preserves_test_chat_flag(
    db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    restaurant_one, _ = restaurants(db)
    flags: list[bool] = []

    def fake_chat_for_restaurant(
        restaurant: Restaurant,
        payload: ChatRequest,
        session: Session,
        is_test: bool = False,
    ) -> ChatResponse:
        assert restaurant.id == restaurant_one.id
        assert payload.message == "Run a test"
        assert session is db
        flags.append(is_test)
        return ChatResponse(answer="Test response", conversation_id="test-id")

    monkeypatch.setattr(admin_chat, "chat_for_restaurant", fake_chat_for_restaurant)

    response = admin_chat.run_test_chat(
        db, restaurant_one, ChatRequest(message="Run a test")
    )

    assert response.answer == "Test response"
    assert flags == [True]


def test_admin_ai_test_wrong_restaurant_access_stays_in_route_layer(
    db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    owner_one, _, _ = users(db)
    _, restaurant_two = restaurants(db)

    def fail_if_called(
        _: Session, __: Restaurant, ___: ChatRequest
    ) -> ChatResponse:
        raise AssertionError("admin chat service should not be called")

    monkeypatch.setattr(admin_chat, "run_test_chat", fail_if_called)

    with pytest.raises(HTTPException) as error:
        admin.test_ai_response(
            restaurant_two.id,
            ChatRequest(message="Can I access this?"),
            db=db,
            user=owner_one,
        )

    assert error.value.status_code == 403
    assert error.value.detail == "You cannot access this restaurant"
