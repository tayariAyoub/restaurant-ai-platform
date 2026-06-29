from collections.abc import Generator
from decimal import Decimal

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api import admin
from app.core.database import Base
from app.core.security import create_access_token, hash_password, verify_password
from app.models import (
    ContactRequest,
    Conversation,
    Message,
    Order,
    Restaurant,
    Theme,
    User,
)
from app.schemas import UserCreate, UserOut


@pytest.fixture()
def db() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    session = TestingSessionLocal()
    try:
        seed_admin_console_data(session)
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db: Session) -> Generator[TestClient, None, None]:
    app = FastAPI()
    app.include_router(admin.router)

    def override_get_db() -> Generator[Session, None, None]:
        yield db

    app.dependency_overrides[admin.get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client


def seed_admin_console_data(db: Session) -> None:
    owner_one = User(
        email="owner-one@example.com",
        password_hash=hash_password("owner-password"),
        name="Owner One",
        role="RESTAURANT_OWNER",
    )
    owner_two = User(
        email="owner-two@example.com",
        password_hash=hash_password("owner-password"),
        name="Owner Two",
        role="RESTAURANT_OWNER",
    )
    super_admin = User(
        email="admin@example.com",
        password_hash=hash_password("admin-password"),
        name="Admin",
        role="SUPER_ADMIN",
    )
    db.add_all([owner_one, owner_two, super_admin])
    db.flush()

    restaurant_one = Restaurant(
        owner_id=owner_one.id,
        name="Tenant One",
        slug="tenant-one",
        city="Berlin",
        email="one@example.com",
    )
    restaurant_two = Restaurant(
        owner_id=owner_two.id,
        name="Tenant Two",
        slug="tenant-two",
        city="Berlin",
        email="two@example.com",
    )
    db.add_all([restaurant_one, restaurant_two])
    db.flush()

    db.add_all(
        [
            ContactRequest(restaurant_id=restaurant_one.id, name="Alice", email="alice@example.com"),
            ContactRequest(restaurant_id=restaurant_two.id, name="Bob", email="bob@example.com"),
            Order(
                restaurant_id=restaurant_one.id,
                public_id="order-one",
                order_type="PICKUP",
                status="NEW",
                customer_name="Alice",
                customer_phone="111",
                customer_email="alice@example.com",
                subtotal=Decimal("12.00"),
                delivery_fee=Decimal("0.00"),
                total=Decimal("12.00"),
            ),
            Order(
                restaurant_id=restaurant_two.id,
                public_id="order-two",
                order_type="PICKUP",
                status="READY",
                customer_name="Bob",
                customer_phone="222",
                customer_email="bob@example.com",
                subtotal=Decimal("14.00"),
                delivery_fee=Decimal("0.00"),
                total=Decimal("14.00"),
            ),
            Theme(
                id=20,
                key="modern",
                name="Modern",
                primary_color="#111111",
                secondary_color="#222222",
                background_color="#ffffff",
                text_color="#000000",
                font_family="Inter",
            ),
            Theme(
                id=10,
                key="classic",
                name="Classic",
                primary_color="#333333",
                secondary_color="#444444",
                background_color="#ffffff",
                text_color="#000000",
                font_family="Serif",
            ),
        ]
    )
    db.flush()

    public_conversation_one = Conversation(restaurant_id=restaurant_one.id)
    public_conversation_two = Conversation(restaurant_id=restaurant_two.id)
    test_conversation = Conversation(restaurant_id=restaurant_one.id, is_test=True)
    db.add_all([public_conversation_one, public_conversation_two, test_conversation])
    db.flush()
    db.add_all(
        [
            Message(
                conversation_id=public_conversation_one.id,
                role="assistant",
                content="I do not know.",
                is_unanswered=True,
            ),
            Message(
                conversation_id=public_conversation_two.id,
                role="assistant",
                content="I do not know.",
                is_unanswered=True,
            ),
            Message(
                conversation_id=test_conversation.id,
                role="assistant",
                content="Test conversation should be excluded.",
                is_unanswered=True,
            ),
        ]
    )
    db.commit()


def users(db: Session) -> tuple[User, User, User]:
    owner_one = db.query(User).filter_by(email="owner-one@example.com").one()
    owner_two = db.query(User).filter_by(email="owner-two@example.com").one()
    super_admin = db.query(User).filter_by(email="admin@example.com").one()
    return owner_one, owner_two, super_admin


def auth_header(email: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_dashboard_stats_are_scoped_for_restaurant_owner(db: Session) -> None:
    owner_one, _, _ = users(db)

    stats = admin.dashboard(db=db, user=owner_one)

    assert stats.restaurants == 1
    assert stats.owners == 1
    assert stats.reservations == 1
    assert stats.conversations == 1
    assert stats.unanswered == 1
    assert stats.new_orders == 1


def test_super_admin_dashboard_counts_all_restaurants_and_owners(db: Session) -> None:
    _, _, super_admin = users(db)

    stats = admin.dashboard(db=db, user=super_admin)

    assert stats.restaurants == 2
    assert stats.owners == 2
    assert stats.reservations == 2
    assert stats.conversations == 2
    assert stats.unanswered == 2
    assert stats.new_orders == 1


def test_users_list_requires_super_admin_dependency(client: TestClient) -> None:
    response = client.get("/admin/users", headers=auth_header("owner-one@example.com"))

    assert response.status_code == 403
    assert response.json()["detail"] == "Super admin required"

    response = client.get("/admin/users", headers=auth_header("admin@example.com"))

    assert response.status_code == 200
    assert {user["email"] for user in response.json()} == {
        "admin@example.com",
        "owner-one@example.com",
        "owner-two@example.com",
    }


def test_create_user_rejects_duplicate_email(db: Session) -> None:
    _, _, super_admin = users(db)

    with pytest.raises(HTTPException) as error:
        admin.create_user(
            UserCreate(
                email="owner-one@example.com",
                name="Duplicate",
                password="new-password",
                role="RESTAURANT_OWNER",
            ),
            db=db,
            _=super_admin,
        )

    assert error.value.status_code == 409
    assert error.value.detail == "Email already exists"


def test_create_user_rejects_invalid_role(db: Session) -> None:
    _, _, super_admin = users(db)

    with pytest.raises(HTTPException) as error:
        admin.create_user(
            UserCreate(
                email="new-owner@example.com",
                name="New Owner",
                password="new-password",
                role="HOST",
            ),
            db=db,
            _=super_admin,
        )

    assert error.value.status_code == 400
    assert error.value.detail == "Invalid role"


def test_create_user_hashes_password_and_preserves_response_shape(db: Session) -> None:
    _, _, super_admin = users(db)

    created = admin.create_user(
        UserCreate(
            email="new-owner@example.com",
            name="New Owner",
            password="new-password",
            role="RESTAURANT_OWNER",
        ),
        db=db,
        _=super_admin,
    )

    assert created.email == "new-owner@example.com"
    assert created.name == "New Owner"
    assert created.role == "RESTAURANT_OWNER"
    assert created.password_hash != "new-password"
    assert verify_password("new-password", created.password_hash)
    assert UserOut.model_validate(created).email == "new-owner@example.com"


def test_themes_are_listed_by_id(db: Session) -> None:
    owner_one, _, _ = users(db)

    listed_themes = admin.themes(db=db, _=owner_one)

    assert [theme.id for theme in listed_themes] == [10, 20]
