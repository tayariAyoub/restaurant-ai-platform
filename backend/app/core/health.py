from dataclasses import dataclass
from pathlib import Path
from typing import Any

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import Engine, inspect, text

from app.core.config import settings, should_run_legacy_startup_migrations
from app.core.database import engine


@dataclass(frozen=True)
class HealthResult:
    status_code: int
    payload: dict[str, Any]


def current_alembic_head() -> str:
    backend_dir = Path(__file__).resolve().parents[2]
    config = Config(str(backend_dir / "alembic.ini"))
    config.set_main_option("script_location", str(backend_dir / "alembic"))
    script = ScriptDirectory.from_config(config)
    return script.get_current_head() or "unknown"


def check_database(database_engine: Engine = engine) -> dict[str, Any]:
    with database_engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ok"}


def check_migrations(database_engine: Engine = engine, config: Any = settings) -> dict[str, Any]:
    inspector = inspect(database_engine)
    expected_revision = current_alembic_head()
    if not inspector.has_table("alembic_version"):
        if should_run_legacy_startup_migrations(config):
            return {
                "status": "warning",
                "expected_revision": expected_revision,
                "message": "Alembic version table is missing; legacy local startup migration mode is active.",
            }
        return {
            "status": "error",
            "expected_revision": expected_revision,
            "message": "Alembic version table is missing. Run `alembic upgrade head` or stamp an existing baseline.",
        }

    with database_engine.connect() as connection:
        current_revision = connection.execute(text("SELECT version_num FROM alembic_version")).scalar()

    if current_revision != expected_revision:
        return {
            "status": "error",
            "current_revision": current_revision,
            "expected_revision": expected_revision,
            "message": "Database migration revision is not current.",
        }

    return {
        "status": "ok",
        "current_revision": current_revision,
        "expected_revision": expected_revision,
    }


def readiness(database_engine: Engine = engine, config: Any = settings) -> HealthResult:
    checks: dict[str, dict[str, Any]] = {}
    status_code = 200

    try:
        checks["database"] = check_database(database_engine)
    except Exception as exc:
        checks["database"] = {"status": "error", "message": str(exc)}
        return HealthResult(
            status_code=503,
            payload={"status": "error", "checks": checks},
        )

    try:
        checks["migrations"] = check_migrations(database_engine, config)
    except Exception as exc:
        checks["migrations"] = {"status": "error", "message": str(exc)}

    if any(check["status"] == "error" for check in checks.values()):
        status_code = 503
        status = "error"
    elif any(check["status"] == "warning" for check in checks.values()):
        status = "warning"
    else:
        status = "ok"

    return HealthResult(
        status_code=status_code,
        payload={"status": status, "checks": checks},
    )
