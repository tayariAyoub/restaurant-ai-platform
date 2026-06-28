import logging
from pathlib import Path
from types import SimpleNamespace

from alembic import command
from alembic.config import Config
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import BaseModel
from sqlalchemy import create_engine

from app.core.errors import register_exception_handlers
from app.core.health import current_alembic_head, readiness
from app.core.request_logging import request_logging_middleware


BACKEND_DIR = Path(__file__).resolve().parents[1]


def reliability_test_app() -> FastAPI:
    app = FastAPI()
    app.middleware("http")(request_logging_middleware)
    register_exception_handlers(app)

    class Payload(BaseModel):
        name: str

    @app.get("/ok")
    def ok() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/missing")
    def missing() -> None:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    @app.post("/validate")
    def validate(payload: Payload) -> dict[str, str]:
        return {"name": payload.name}

    @app.get("/boom")
    def boom() -> None:
        raise RuntimeError("private implementation detail")

    return app


def make_alembic_config(database_url: str) -> Config:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    config.set_main_option("sqlalchemy.url", database_url)
    return config


def make_health_config(app_env: str, auto_migrate_on_startup: bool | None):
    return SimpleNamespace(
        app_env=app_env,
        auto_migrate_on_startup=auto_migrate_on_startup,
    )


def test_http_errors_keep_detail_and_add_error_envelope():
    client = TestClient(reliability_test_app())

    response = client.get("/missing", headers={"X-Request-ID": "req-123"})
    payload = response.json()

    assert response.status_code == 404
    assert response.headers["X-Request-ID"] == "req-123"
    assert payload["detail"] == "Restaurant not found"
    assert payload["error"] == {
        "code": "not_found",
        "message": "Restaurant not found",
        "status_code": 404,
        "request_id": "req-123",
    }


def test_validation_errors_keep_fastapi_detail_and_add_error_envelope():
    client = TestClient(reliability_test_app())

    response = client.post("/validate", json={}, headers={"X-Request-ID": "req-validation"})
    payload = response.json()

    assert response.status_code == 422
    assert isinstance(payload["detail"], list)
    assert payload["error"]["code"] == "validation_error"
    assert payload["error"]["message"] == "Request validation failed."
    assert payload["error"]["request_id"] == "req-validation"


def test_unhandled_errors_hide_internal_details():
    client = TestClient(reliability_test_app(), raise_server_exceptions=False)

    response = client.get("/boom", headers={"X-Request-ID": "req-boom"})
    payload = response.json()

    assert response.status_code == 500
    assert payload["detail"] == "Internal server error"
    assert payload["error"]["code"] == "internal_server_error"
    assert payload["error"]["request_id"] == "req-boom"
    assert "private implementation detail" not in response.text


def test_request_logging_adds_request_id_and_logs_completion(caplog):
    client = TestClient(reliability_test_app())

    with caplog.at_level(logging.INFO, logger="restaurantai.requests"):
        response = client.get("/ok", headers={"X-Request-ID": "req-ok"})

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == "req-ok"
    assert "Request completed" in caplog.text


def test_readiness_allows_local_legacy_schema_mode_without_alembic_table(tmp_path):
    database_url = f"sqlite:///{tmp_path / 'legacy-local.db'}"
    engine = create_engine(database_url)

    result = readiness(engine, make_health_config("development", True))

    assert result.status_code == 200
    assert result.payload["status"] == "warning"
    assert result.payload["checks"]["migrations"]["status"] == "warning"


def test_readiness_fails_production_without_alembic_table(tmp_path):
    database_url = f"sqlite:///{tmp_path / 'missing-version.db'}"
    engine = create_engine(database_url)

    result = readiness(engine, make_health_config("production", False))

    assert result.status_code == 503
    assert result.payload["status"] == "error"
    assert result.payload["checks"]["migrations"]["status"] == "error"


def test_readiness_passes_when_database_is_migrated(tmp_path):
    database_url = f"sqlite:///{tmp_path / 'ready.db'}"
    command.upgrade(make_alembic_config(database_url), "head")
    engine = create_engine(database_url)

    result = readiness(engine, make_health_config("production", False))

    assert result.status_code == 200
    assert result.payload["status"] == "ok"
    assert result.payload["checks"]["migrations"]["current_revision"] == current_alembic_head()
