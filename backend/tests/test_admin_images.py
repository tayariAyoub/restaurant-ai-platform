from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api import admin
from app.core.config import settings
from app.core.database import Base
from app.models import Restaurant, RestaurantImage, User


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
    session.add_all([owner, other_owner])
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


@pytest.fixture()
def client(
    db: Session, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> Generator[TestClient, None, None]:
    monkeypatch.setattr(settings, "storage_provider", "local")
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    app = FastAPI()
    app.include_router(admin.router)

    def override_get_db() -> Generator[Session, None, None]:
        yield db

    def override_get_current_user() -> User:
        user = db.scalar(select(User).where(User.email == "owner@example.com"))
        assert user is not None
        return user

    app.dependency_overrides[admin.get_db] = override_get_db
    app.dependency_overrides[admin.get_current_user] = override_get_current_user
    with TestClient(app) as test_client:
        yield test_client


def test_owner_can_upload_image(client: TestClient, tmp_path: Path):
    response = client.post(
        "/admin/restaurants/1/images",
        data={"image_type": "gallery", "alt_text": "Dining room"},
        files={"file": ("dining.png", b"image-bytes", "image/png")},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["restaurant_id"] == 1
    assert payload["image_type"] == "gallery"
    assert payload["url"].startswith("/uploads/1/")
    assert payload["url"].endswith(".png")
    assert payload["alt_text"] == "Dining room"
    assert payload["sort_order"] == 0
    assert (tmp_path / payload["url"].removeprefix("/uploads/")).exists()


def test_logo_and_hero_uploads_update_restaurant_fields(
    client: TestClient, db: Session
):
    logo = client.post(
        "/admin/restaurants/1/images",
        data={"image_type": "logo", "alt_text": "Bella Napoli logo"},
        files={"file": ("logo.png", b"logo-bytes", "image/png")},
    ).json()
    hero = client.post(
        "/admin/restaurants/1/images",
        data={"image_type": "hero", "alt_text": "Dining room hero"},
        files={"file": ("hero.webp", b"hero-bytes", "image/webp")},
    ).json()

    restaurant = db.get(Restaurant, 1)
    assert restaurant is not None
    assert restaurant.logo_url == logo["url"]
    assert restaurant.hero_image == hero["url"]


def test_image_url_creation_remains_restaurant_scoped(
    client: TestClient, db: Session
):
    response = client.post(
        "/admin/restaurants/2/image-url",
        json={
            "image_type": "gallery",
            "url": "https://cdn.example.com/private.jpg",
            "alt_text": "Private",
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "You cannot access this restaurant"
    assert db.query(RestaurantImage).filter_by(restaurant_id=2).count() == 0


def test_delete_image_clears_featured_fields_and_removes_file(
    client: TestClient, db: Session, tmp_path: Path
):
    logo = client.post(
        "/admin/restaurants/1/images",
        data={"image_type": "logo", "alt_text": "Bella Napoli logo"},
        files={"file": ("logo.png", b"logo-bytes", "image/png")},
    ).json()
    hero = client.post(
        "/admin/restaurants/1/images",
        data={"image_type": "hero", "alt_text": "Dining room hero"},
        files={"file": ("hero.png", b"hero-bytes", "image/png")},
    ).json()
    logo_path = tmp_path / logo["url"].removeprefix("/uploads/")
    hero_path = tmp_path / hero["url"].removeprefix("/uploads/")
    assert logo_path.exists()
    assert hero_path.exists()

    logo_response = client.delete(f"/admin/restaurants/1/images/{logo['id']}")
    hero_response = client.delete(f"/admin/restaurants/1/images/{hero['id']}")

    assert logo_response.status_code == 204
    assert hero_response.status_code == 204
    db.expire_all()
    restaurant = db.get(Restaurant, 1)
    assert restaurant is not None
    assert restaurant.logo_url == ""
    assert restaurant.hero_image == ""
    assert db.get(RestaurantImage, logo["id"]) is None
    assert db.get(RestaurantImage, hero["id"]) is None
    assert not logo_path.exists()
    assert not hero_path.exists()


def test_image_upload_rejects_invalid_file_type(client: TestClient):
    response = client.post(
        "/admin/restaurants/1/images",
        data={"image_type": "gallery", "alt_text": "Bad image"},
        files={"file": ("bad.txt", b"not-an-image", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Upload JPG, PNG, WEBP, or GIF images"


def test_wrong_restaurant_image_upload_stays_in_route_layer(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    def fail_if_called(*_: object, **__: object) -> RestaurantImage:
        raise AssertionError("restaurant image service should not be called")

    monkeypatch.setattr(admin.restaurant_images, "upload_image", fail_if_called)

    response = client.post(
        "/admin/restaurants/2/images",
        data={"image_type": "gallery", "alt_text": "Private"},
        files={"file": ("private.png", b"image-bytes", "image/png")},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "You cannot access this restaurant"
