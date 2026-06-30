from collections.abc import Generator

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api import admin
from app.core.database import Base
from app.models import MenuCategory, Restaurant, RestaurantImage, User
from app.schemas import RestaurantCreate, RestaurantUpdate
from app.services import restaurants as restaurant_service


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
    owner = User(
        email="owner@example.com",
        password_hash="hash",
        name="Owner",
        role="RESTAURANT_OWNER",
        is_active=True,
    )
    other_owner = User(
        email="other-owner@example.com",
        password_hash="hash",
        name="Other Owner",
        role="RESTAURANT_OWNER",
        is_active=True,
    )
    super_admin = User(
        email="admin@example.com",
        password_hash="hash",
        name="Admin",
        role="SUPER_ADMIN",
        is_active=True,
    )
    session.add_all([owner, other_owner, super_admin])
    session.flush()
    session.add_all(
        [
            Restaurant(
                owner_id=owner.id,
                name="Bella Napoli",
                slug="bella-napoli",
                email="ciao@bella.example",
                city="Aachen",
            ),
            Restaurant(
                owner_id=other_owner.id,
                name="Private Bistro",
                slug="private-bistro",
                email="private@example.com",
                city="Berlin",
            ),
        ]
    )
    session.commit()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def users(db: Session) -> tuple[User, User, User]:
    owner = db.query(User).filter_by(email="owner@example.com").one()
    other_owner = db.query(User).filter_by(email="other-owner@example.com").one()
    super_admin = db.query(User).filter_by(email="admin@example.com").one()
    return owner, other_owner, super_admin


def restaurants(db: Session) -> tuple[Restaurant, Restaurant]:
    bella = db.query(Restaurant).filter_by(slug="bella-napoli").one()
    private = db.query(Restaurant).filter_by(slug="private-bistro").one()
    return bella, private


def create_payload(**overrides: object) -> RestaurantCreate:
    data: dict[str, object] = {
        "name": "New Restaurant",
        "slug": "new-restaurant",
        "email": "new@example.com",
        "city": "Aachen",
    }
    data.update(overrides)
    return RestaurantCreate(**data)


def update_payload(**overrides: object) -> RestaurantUpdate:
    data: dict[str, object] = {
        "name": "Updated Restaurant",
        "slug": "updated-restaurant",
        "email": "updated@example.com",
        "city": "Cologne",
    }
    data.update(overrides)
    return RestaurantUpdate(**data)


def test_owner_restaurant_listing_remains_scoped(db: Session) -> None:
    owner, _, _ = users(db)

    visible = admin.restaurants(db=db, user=owner)

    assert [restaurant.slug for restaurant in visible] == ["bella-napoli"]


def test_super_admin_restaurant_listing_sees_all_restaurants(db: Session) -> None:
    _, _, super_admin = users(db)

    visible = admin.restaurants(db=db, user=super_admin)

    assert {restaurant.slug for restaurant in visible} == {
        "bella-napoli",
        "private-bistro",
    }


def test_owner_restaurant_overview_remains_scoped(db: Session) -> None:
    owner, _, _ = users(db)

    overviews = admin.restaurants_overview(db=db, user=owner)

    assert [overview.slug for overview in overviews] == ["bella-napoli"]


def test_super_admin_restaurant_overview_sees_all_restaurants(db: Session) -> None:
    _, _, super_admin = users(db)

    overviews = admin.restaurants_overview(db=db, user=super_admin)

    assert {overview.slug for overview in overviews} == {
        "bella-napoli",
        "private-bistro",
    }


def test_restaurant_overview_response_shape_remains_unchanged(db: Session) -> None:
    owner, _, _ = users(db)

    overview = admin.restaurants_overview(db=db, user=owner)[0]

    assert set(overview.model_dump()) == {
        "id",
        "owner_id",
        "theme_id",
        "name",
        "slug",
        "city",
        "email",
        "hero_image",
        "is_published",
        "created_at",
        "owner_name",
        "owner_email",
        "theme_name",
        "menu_items",
        "image_count",
        "reservation_count",
        "new_reservations",
        "new_orders",
        "conversation_count",
        "unanswered_count",
        "setup_percent",
        "checklist",
    }
    assert set(overview.checklist.model_dump()) == {
        "information",
        "opening_hours",
        "branding",
        "menu",
        "design",
        "chatbot",
    }


def test_create_restaurant_normalizes_slug(db: Session) -> None:
    owner, _, _ = users(db)

    created = admin.create_restaurant(
        create_payload(
            name="Maison Chic",
            slug="  Maison Chic!!  ",
            email="maison@example.com",
        ),
        db=db,
        user=owner,
    )

    assert created.slug == "maison-chic"


def test_create_restaurant_duplicate_slug_still_returns_409(db: Session) -> None:
    owner, _, _ = users(db)

    with pytest.raises(HTTPException) as error:
        admin.create_restaurant(
            create_payload(slug="bella-napoli", email="duplicate@example.com"),
            db=db,
            user=owner,
        )

    assert error.value.status_code == 409
    assert error.value.detail == "Website slug already exists"


def test_owner_create_cannot_assign_another_owner(db: Session) -> None:
    owner, other_owner, _ = users(db)

    created = admin.create_restaurant(
        create_payload(
            slug="owner-controlled",
            email="owner-controlled@example.com",
            owner_id=other_owner.id,
        ),
        db=db,
        user=owner,
    )

    assert created.owner_id == owner.id


def test_super_admin_create_can_assign_owner(db: Session) -> None:
    owner, _, super_admin = users(db)

    created = admin.create_restaurant(
        create_payload(
            slug="assigned-restaurant",
            email="assigned@example.com",
            owner_id=owner.id,
        ),
        db=db,
        user=super_admin,
    )

    assert created.owner_id == owner.id


def test_super_admin_create_with_missing_owner_returns_404(db: Session) -> None:
    _, _, super_admin = users(db)

    with pytest.raises(HTTPException) as error:
        admin.create_restaurant(
            create_payload(
                slug="missing-owner",
                email="missing-owner@example.com",
                owner_id=999,
            ),
            db=db,
            user=super_admin,
        )

    assert error.value.status_code == 404
    assert error.value.detail == "Owner not found"


def test_update_preserves_owner_for_non_super_admin(db: Session) -> None:
    owner, other_owner, _ = users(db)
    bella, _ = restaurants(db)

    updated = admin.update_restaurant(
        bella.id,
        update_payload(owner_id=other_owner.id),
        db=db,
        user=owner,
    )

    assert updated.owner_id == owner.id
    assert updated.slug == "updated-restaurant"


def test_update_duplicate_slug_still_returns_409(db: Session) -> None:
    owner, _, _ = users(db)
    bella, _ = restaurants(db)

    with pytest.raises(HTTPException) as error:
        admin.update_restaurant(
            bella.id,
            update_payload(slug="private-bistro"),
            db=db,
            user=owner,
        )

    assert error.value.status_code == 409
    assert error.value.detail == "Website slug already exists"


def test_update_still_rebuilds_structured_knowledge(
    db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    owner, _, _ = users(db)
    bella, _ = restaurants(db)
    rebuilt_restaurant_ids: list[int] = []

    monkeypatch.setattr(
        restaurant_service,
        "rebuild_structured_knowledge",
        lambda _db, restaurant_id: rebuilt_restaurant_ids.append(restaurant_id),
    )

    admin.update_restaurant(
        bella.id,
        update_payload(slug="rebuilt-restaurant"),
        db=db,
        user=owner,
    )

    assert rebuilt_restaurant_ids == [bella.id]


def test_delete_missing_restaurant_still_returns_404(db: Session) -> None:
    _, _, super_admin = users(db)

    with pytest.raises(HTTPException) as error:
        admin.delete_restaurant(999, db=db, _=super_admin)

    assert error.value.status_code == 404
    assert error.value.detail == "Restaurant not found"


def test_route_level_access_helper_behavior_remains_unchanged(db: Session) -> None:
    owner, other_owner, super_admin = users(db)
    bella, private = restaurants(db)

    assert restaurant_service.get_restaurant_for_user(db, bella.id, owner).id == bella.id
    with pytest.raises(HTTPException) as error:
        restaurant_service.get_restaurant_for_user(db, private.id, owner)
    assert error.value.status_code == 403
    assert error.value.detail == "You cannot access this restaurant"
    assert restaurant_service.get_restaurant_for_user(db, private.id, other_owner).id == private.id
    assert restaurant_service.get_restaurant_for_user(db, private.id, super_admin).id == private.id


def test_missing_restaurant_access_still_returns_404(db: Session) -> None:
    owner, _, _ = users(db)

    with pytest.raises(HTTPException) as error:
        restaurant_service.get_restaurant_for_user(db, 999, owner)

    assert error.value.status_code == 404
    assert error.value.detail == "Restaurant not found"


def test_restaurant_access_helper_still_sorts_categories_and_images(
    db: Session,
) -> None:
    owner, _, _ = users(db)
    bella, _ = restaurants(db)
    db.add_all(
        [
            MenuCategory(
                restaurant_id=bella.id,
                name="Second Category",
                sort_order=2,
            ),
            MenuCategory(
                restaurant_id=bella.id,
                name="First Category",
                sort_order=1,
            ),
            RestaurantImage(
                restaurant_id=bella.id,
                image_type="gallery",
                url="/uploads/1/second.png",
                sort_order=2,
            ),
            RestaurantImage(
                restaurant_id=bella.id,
                image_type="gallery",
                url="/uploads/1/first.png",
                sort_order=1,
            ),
        ]
    )
    db.commit()

    restaurant = restaurant_service.get_restaurant_for_user(db, bella.id, owner)

    assert [category.name for category in restaurant.categories] == [
        "First Category",
        "Second Category",
    ]
    assert [image.url for image in restaurant.images] == [
        "/uploads/1/first.png",
        "/uploads/1/second.png",
    ]


def test_representative_route_still_calls_access_helper_explicitly(
    db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    owner, _, _ = users(db)
    bella, _ = restaurants(db)
    calls: list[tuple[int, int]] = []

    def fake_get_restaurant_for_user(
        _db: Session, restaurant_id: int, user: User
    ) -> Restaurant:
        calls.append((restaurant_id, user.id))
        return bella

    monkeypatch.setattr(
        admin.restaurant_service,
        "get_restaurant_for_user",
        fake_get_restaurant_for_user,
    )

    admin.documents(bella.id, db=db, user=owner)

    assert calls == [(bella.id, owner.id)]
