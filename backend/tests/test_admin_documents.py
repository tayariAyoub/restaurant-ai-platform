from collections.abc import Generator
from datetime import datetime, timedelta, timezone
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
from app.models import KnowledgeChunk, KnowledgeDocument, Restaurant, User
from app.services import documents as documents_service


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
    monkeypatch.setattr(settings, "openai_api_key", "")
    monkeypatch.setattr(
        documents_service,
        "create_embeddings",
        lambda texts: [None] * len(texts),
    )
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


def test_txt_upload_creates_document_and_chunks(
    client: TestClient, db: Session, tmp_path: Path
):
    response = client.post(
        "/admin/restaurants/1/documents",
        files={
            "file": (
                "guest-details.txt",
                b"Private dining is available upstairs. Ask about tasting menus.",
                "text/plain",
            )
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["restaurant_id"] == 1
    assert payload["filename"].endswith("-guest-details.txt")
    assert payload["content_type"] == "text/plain"
    assert payload["status"] == "processed"

    document = db.get(KnowledgeDocument, payload["id"])
    assert document is not None
    assert document.restaurant_id == 1
    assert document.filename == payload["filename"]
    assert (tmp_path / "1" / "documents" / document.filename).exists()

    chunks = db.query(KnowledgeChunk).filter_by(document_id=document.id).all()
    assert len(chunks) == 1
    assert chunks[0].restaurant_id == 1
    assert chunks[0].source == document.filename
    assert "Private dining is available upstairs" in chunks[0].content
    assert db.query(KnowledgeDocument).filter_by(restaurant_id=2).count() == 0


def test_empty_readable_text_returns_existing_error(client: TestClient):
    response = client.post(
        "/admin/restaurants/1/documents",
        files={"file": ("empty.txt", b"  \n\t", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "No readable text found"


def test_unsupported_file_type_returns_existing_error(client: TestClient):
    response = client.post(
        "/admin/restaurants/1/documents",
        files={
            "file": (
                "menu.docx",
                b"unsupported document",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Only PDF and TXT files are supported."


def test_document_listing_is_scoped_and_newest_first(
    client: TestClient, db: Session
):
    older = KnowledgeDocument(
        restaurant_id=1,
        filename="older.txt",
        content_type="text/plain",
        created_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    newer = KnowledgeDocument(
        restaurant_id=1,
        filename="newer.txt",
        content_type="text/plain",
        created_at=datetime.now(timezone.utc),
    )
    other_restaurant = KnowledgeDocument(
        restaurant_id=2,
        filename="private.txt",
        content_type="text/plain",
        created_at=datetime.now(timezone.utc) + timedelta(days=1),
    )
    db.add_all([older, newer, other_restaurant])
    db.commit()

    response = client.get("/admin/restaurants/1/documents")

    assert response.status_code == 200
    filenames = [document["filename"] for document in response.json()]
    assert filenames == ["newer.txt", "older.txt"]


def test_wrong_restaurant_document_upload_stays_in_route_layer(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    def fail_if_called(*_: object, **__: object) -> KnowledgeDocument:
        raise AssertionError("document service should not be called")

    monkeypatch.setattr(admin.document_service, "upload_document", fail_if_called)

    response = client.post(
        "/admin/restaurants/2/documents",
        files={"file": ("private.txt", b"private notes", "text/plain")},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "You cannot access this restaurant"
