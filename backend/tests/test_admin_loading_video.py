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
from app.models import Restaurant, User


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
    session.add(owner)
    session.flush()
    session.add(
        Restaurant(
            owner_id=owner.id,
            name="Bella Napoli",
            slug="bella-napoli",
            email="ciao@bella.example",
            city="Aachen",
        )
    )
    session.commit()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db: Session, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Generator[TestClient, None, None]:
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


def test_owner_can_upload_loading_video(client: TestClient):
    response = client.post(
        "/admin/restaurants/1/loading-video",
        files={"file": ("loading.mp4", b"video-bytes", "video/mp4")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["loading_video_url"].startswith("/uploads/1/videos/")
    assert payload["loading_video_url"].endswith(".mp4")
    assert payload["loading_video_filename"] == "loading.mp4"
    assert payload["loading_video_size_bytes"] == len(b"video-bytes")


def test_replacing_loading_video_removes_previous_file(client: TestClient, tmp_path: Path):
    first = client.post(
        "/admin/restaurants/1/loading-video",
        files={"file": ("first.mp4", b"first-video", "video/mp4")},
    ).json()
    previous_path = tmp_path / first["loading_video_url"].removeprefix("/uploads/")
    assert previous_path.exists()

    second = client.post(
        "/admin/restaurants/1/loading-video",
        files={"file": ("second.mp4", b"second-video", "video/mp4")},
    ).json()

    next_path = tmp_path / second["loading_video_url"].removeprefix("/uploads/")
    assert not previous_path.exists()
    assert next_path.exists()


def test_owner_can_remove_loading_video(client: TestClient, tmp_path: Path):
    upload = client.post(
        "/admin/restaurants/1/loading-video",
        files={"file": ("loading.mp4", b"video-bytes", "video/mp4")},
    ).json()
    stored_path = tmp_path / upload["loading_video_url"].removeprefix("/uploads/")
    assert stored_path.exists()

    response = client.delete("/admin/restaurants/1/loading-video")

    assert response.status_code == 200
    assert response.json()["loading_video_url"] == ""
    assert response.json()["loading_video_filename"] == ""
    assert response.json()["loading_video_size_bytes"] == 0
    assert not stored_path.exists()


def test_loading_video_rejects_non_mp4_upload(client: TestClient):
    response = client.post(
        "/admin/restaurants/1/loading-video",
        files={"file": ("loading.mov", b"video-bytes", "video/quicktime")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Upload an MP4 loading video"
