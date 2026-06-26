from collections.abc import Generator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api import auth
from app.core.config import settings
from app.core.database import Base
from app.core.security import create_access_token, hash_password
from app.models import User


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
    session.add(
        User(
            email="owner@example.com",
            password_hash=hash_password("owner-password"),
            name="Owner",
            role="RESTAURANT_OWNER",
            is_active=True,
        )
    )
    session.commit()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db: Session) -> Generator[TestClient, None, None]:
    app = FastAPI()
    app.include_router(auth.router)

    def override_get_db() -> Generator[Session, None, None]:
        yield db

    app.dependency_overrides[auth.get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def auth_cookie_defaults(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "auth_cookie_enabled", False)
    monkeypatch.setattr(settings, "auth_cookie_name", "restaurant_ai_access_token")
    monkeypatch.setattr(settings, "auth_cookie_secure", False)
    monkeypatch.setattr(settings, "auth_cookie_samesite", "lax")
    monkeypatch.setattr(settings, "auth_cookie_max_age_seconds", 43200)


def login(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/auth/login",
        json={"email": "owner@example.com", "password": "owner-password"},
    )
    assert response.status_code == 200
    return response.json()


def test_login_keeps_existing_bearer_response_without_cookie_by_default(
    client: TestClient,
) -> None:
    payload = login(client)

    assert payload["access_token"]
    assert payload["token_type"] == "bearer"
    assert "restaurant_ai_access_token" not in client.cookies


def test_bearer_auth_still_works(client: TestClient) -> None:
    payload = login(client)

    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {payload['access_token']}"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == "owner@example.com"


def test_cookie_auth_works_when_enabled(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "auth_cookie_enabled", True)

    login(client)
    response = client.get("/auth/me")

    assert settings.auth_cookie_name in client.cookies
    assert response.status_code == 200
    assert response.json()["email"] == "owner@example.com"


def test_logout_clears_auth_cookie(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "auth_cookie_enabled", True)
    login(client)

    response = client.post("/auth/logout")

    assert response.status_code == 204
    assert settings.auth_cookie_name not in client.cookies
    assert "Max-Age=0" in response.headers["set-cookie"]


def test_bearer_auth_takes_priority_over_invalid_cookie(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "auth_cookie_enabled", True)
    token = create_access_token("owner@example.com")
    client.cookies.set(settings.auth_cookie_name, "not-a-valid-token")

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["email"] == "owner@example.com"
