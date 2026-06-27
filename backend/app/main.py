from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api import admin, auth, public
from app.core.config import collect_configuration_issues, settings
from app.core.database import Base, SessionLocal, engine
from app.services.migrations import upgrade_existing_database
from app.services.seed import seed_demo_data

logger = logging.getLogger("restaurantai.config")


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


@asynccontextmanager
async def lifespan(_: FastAPI):
    validate_environment_configuration()
    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(bind=engine)
    upgrade_existing_database()
    with SessionLocal() as db:
        seed_demo_data(db)
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="API for premium restaurant websites, admin operations, and a grounded AI Maitre d'.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(public.router, prefix=settings.api_prefix)
app.include_router(admin.router, prefix=settings.api_prefix)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir, check_dir=False), name="uploads")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
