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
from app.services import chat, knowledge
from app.schemas import (
    ChatRequest,
    CategoryUpdate,
    DeliveryAddressCreate,
    ImageUrlCreate,
    MessageReviewUpdate,
    OrderCreate,
    OrderItemCreate,
    OrderStatusUpdate,
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


def test_category_update_is_restaurant_scoped(db: Session) -> None:
    owner_one, owner_two, _ = users(db)
    restaurant_one, restaurant_two = restaurants(db)
    category_one = db.query(MenuCategory).filter_by(restaurant_id=restaurant_one.id).one()
    category_two = db.query(MenuCategory).filter_by(restaurant_id=restaurant_two.id).one()

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


def test_orders_are_scoped_to_restaurant_owner(db: Session) -> None:
    owner_one, owner_two, _ = users(db)
    restaurant_one, restaurant_two = restaurants(db)

    owner_one_orders = admin.orders(restaurant_one.id, db=db, user=owner_one)
    assert [order.public_id for order in owner_one_orders] == ["order-tenant-one"]

    with pytest.raises(HTTPException) as error:
        admin.orders(restaurant_two.id, db=db, user=owner_one)
    assert error.value.status_code == 403
    assert [order.public_id for order in admin.orders(restaurant_two.id, db=db, user=owner_two)] == ["order-tenant-two"]


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
    assert admin.faqs(restaurant_two.id, db=db, user=owner_two) == []


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

    assert admin.build_restaurant_overview(db, restaurant_one).unanswered_count == 1

    reviewed = admin.review_unanswered_message(
        restaurant_one.id,
        message.id,
        MessageReviewUpdate(is_reviewed=True),
        db=db,
        user=owner_one,
    )

    assert reviewed.is_reviewed is True
    assert admin.build_restaurant_overview(db, restaurant_one).unanswered_count == 0


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
    assert admin.conversations(restaurant_one.id, include_test=False, db=db, user=owner_one) == []
    assert len(admin.conversations(restaurant_one.id, include_test=True, db=db, user=owner_one)) == 1
