import logging

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.rate_limit import (
    RateLimitRule,
    auth_rule,
    chat_rule,
    client_ip,
    limiter,
    public_rule,
    rate_limit,
)


@pytest.fixture(autouse=True)
def reset_limiter() -> None:
    limiter.reset()


def test_rate_limit_allows_requests_under_limit() -> None:
    app = FastAPI()

    @app.get("/public", dependencies=[rate_limit(lambda: RateLimitRule("test", 2))])
    def public() -> dict[str, str]:
        return {"status": "ok"}

    client = TestClient(app)

    assert client.get("/public").status_code == 200
    assert client.get("/public").status_code == 200


def test_rate_limit_returns_friendly_429_and_logs(caplog: pytest.LogCaptureFixture) -> None:
    app = FastAPI()

    @app.post("/chat", dependencies=[rate_limit(lambda: RateLimitRule("chat_test", 1))])
    def chat() -> dict[str, str]:
        return {"status": "ok"}

    client = TestClient(app)

    assert client.post("/chat").status_code == 200
    with caplog.at_level(logging.WARNING, logger="restaurantai.rate_limit"):
        response = client.post("/chat")

    assert response.status_code == 429
    assert response.headers["Retry-After"]
    assert response.json()["detail"]["message"] == (
        "Too many requests. Please wait a moment and try again."
    )
    assert response.json()["detail"]["retry_after_seconds"] >= 1
    assert "Rate limit exceeded" in caplog.text


def test_rate_limit_uses_client_ip_by_default(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "trust_proxy_headers", False)
    app = FastAPI()

    @app.get("/ip")
    def ip(request: Request) -> dict[str, str]:
        return {"ip": client_ip(request)}

    client = TestClient(app)
    response = client.get("/ip", headers={"X-Forwarded-For": "203.0.113.10"})

    assert response.json()["ip"] == "testclient"


def test_rate_limit_can_use_trusted_forwarded_for(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "trust_proxy_headers", True)
    app = FastAPI()

    @app.get("/ip")
    def ip(request: Request) -> dict[str, str]:
        return {"ip": client_ip(request)}

    client = TestClient(app)
    response = client.get("/ip", headers={"X-Forwarded-For": "203.0.113.10, 10.0.0.1"})

    assert response.json()["ip"] == "203.0.113.10"


def test_public_default_limit_is_demo_friendly() -> None:
    assert public_rule().limit == 100


def test_chat_default_limit_protects_openai_usage_without_blocking_demo() -> None:
    assert chat_rule().limit == 10


def test_auth_default_limit_protects_login_without_blocking_demo() -> None:
    assert auth_rule().limit == 10


def test_chat_and_general_public_limits_use_separate_buckets() -> None:
    app = FastAPI()

    @app.post("/chat", dependencies=[rate_limit(lambda: RateLimitRule("chat_bucket", 1))])
    def chat() -> dict[str, str]:
        return {"status": "chat-ok"}

    @app.get("/restaurant", dependencies=[rate_limit(lambda: RateLimitRule("public_bucket", 1))])
    def restaurant() -> dict[str, str]:
        return {"status": "public-ok"}

    client = TestClient(app)

    assert client.post("/chat").status_code == 200
    assert client.post("/chat").status_code == 429
    assert client.get("/restaurant").status_code == 200


def test_same_chat_limit_applies_per_ip_not_globally(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "trust_proxy_headers", True)
    app = FastAPI()

    @app.post("/restaurants/bella-napoli/chat", dependencies=[rate_limit(lambda: RateLimitRule("chat_per_ip", 1))])
    def restaurant_chat() -> dict[str, str]:
        return {"status": "chat-ok"}

    client = TestClient(app)

    assert client.post(
        "/restaurants/bella-napoli/chat",
        headers={"X-Forwarded-For": "203.0.113.10"},
    ).status_code == 200
    assert client.post(
        "/restaurants/bella-napoli/chat",
        headers={"X-Forwarded-For": "203.0.113.10"},
    ).status_code == 429
    assert client.post(
        "/restaurants/bella-napoli/chat",
        headers={"X-Forwarded-For": "203.0.113.11"},
    ).status_code == 200
