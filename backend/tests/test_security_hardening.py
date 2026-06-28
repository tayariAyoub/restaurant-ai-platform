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
from app.core.security import hash_password
from app.core.security_headers import security_headers_middleware
from app.models import User


def security_headers_test_app() -> FastAPI:
    app = FastAPI()
    app.middleware("http")(security_headers_middleware)

    @app.get("/ok")
    def ok() -> dict[str, str]:
        return {"status": "ok"}

    return app


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
def auth_client(db: Session, monkeypatch: pytest.MonkeyPatch) -> Generator[TestClient, None, None]:
    monkeypatch.setattr(settings, "rate_limit_auth_per_minute", 2)
    app = FastAPI()
    app.include_router(auth.router)

    def override_get_db() -> Generator[Session, None, None]:
        yield db

    app.dependency_overrides[auth.get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client


def test_security_headers_are_added_without_hsts_in_development(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(settings, "app_env", "development")
    client = TestClient(security_headers_test_app())

    response = client.get("/ok")

    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "no-referrer"
    assert response.headers["Permissions-Policy"] == "camera=(), microphone=(), geolocation=()"
    assert "Strict-Transport-Security" not in response.headers


def test_security_headers_add_hsts_in_production(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(settings, "app_env", "production")
    client = TestClient(security_headers_test_app())

    response = client.get("/ok")

    assert response.headers["Strict-Transport-Security"] == "max-age=31536000; includeSubDomains"


def test_auth_login_rate_limit_uses_separate_configurable_bucket(auth_client: TestClient):
    for _ in range(2):
        response = auth_client.post(
            "/auth/login",
            json={"email": "owner@example.com", "password": "wrong-password"},
        )
        assert response.status_code == 401

    response = auth_client.post(
        "/auth/login",
        json={"email": "owner@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 429
    assert response.headers["Retry-After"]
    assert response.json()["detail"]["message"] == "Too many requests. Please wait a moment and try again."
