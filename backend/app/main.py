from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api import admin, auth, public
from app.core.config import (
    collect_configuration_issues,
    cors_origins,
    settings,
    should_run_legacy_startup_migrations,
    should_seed_demo_data,
)
from app.core.database import Base, SessionLocal, engine
from app.core.errors import register_exception_handlers
from app.core.health import readiness
from app.core.request_logging import request_logging_middleware
from app.core.security_headers import security_headers_middleware
from app.services.migrations import upgrade_existing_database
from app.services.seed import seed_demo_data

logger = logging.getLogger("restaurantai.config")


def configure_logging() -> None:
    level = getattr(logging, settings.log_level.upper(), logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )
    logging.getLogger("restaurantai").setLevel(level)


def validate_environment_configuration() -> None:
    report = collect_configuration_issues(settings)
    for warning in report.warnings:
        logger.warning(warning)
    for error in report.errors:
        logger.error(error)
    if report.errors:
        raise RuntimeError("Invalid backend environment configuration. Check required environment variables.")

    if settings.openai_api_key and settings.openai_api_key.strip():
        logger.info("OpenAI API key detected; AI chat and embeddings are enabled.")


def prepare_database_for_startup() -> None:
    if not should_run_legacy_startup_migrations(settings):
        logger.info("Skipping legacy startup schema mutation. Run `alembic upgrade head` before production startup.")
        return

    if engine.dialect.name == "postgresql":
        with engine.begin() as connection:
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(bind=engine)
    upgrade_existing_database()


def seed_database_for_startup() -> None:
    if not should_seed_demo_data(settings):
        logger.info("Skipping demo seed data. Set SEED_DEMO_DATA=true only for local/demo environments.")
        return

    with SessionLocal() as db:
        seed_demo_data(db)


@asynccontextmanager
async def lifespan(_: FastAPI):
    validate_environment_configuration()
    prepare_database_for_startup()
    seed_database_for_startup()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="API for premium restaurant websites, admin operations, and a grounded AI Maitre d'.",
    lifespan=lifespan,
)
configure_logging()
app.middleware("http")(request_logging_middleware)
app.middleware("http")(security_headers_middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(settings),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
register_exception_handlers(app)
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(public.router, prefix=settings.api_prefix)
app.include_router(admin.router, prefix=settings.api_prefix)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir, check_dir=False), name="uploads")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/live")
def health_live() -> dict[str, str]:
    return {"status": "ok", "version": settings.app_version}


@app.get("/health/ready")
def health_ready(response: Response) -> dict:
    result = readiness()
    response.status_code = result.status_code
    return result.payload
