from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api import admin, auth, public
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.services.migrations import upgrade_existing_database
from app.services.seed import seed_demo_data

logger = logging.getLogger("restaurantai.config")


def log_openai_configuration() -> None:
    if settings.openai_api_key and settings.openai_api_key.strip():
        logger.info("OpenAI API key detected; AI chat and embeddings are enabled.")
    else:
        logger.warning(
            "OPENAI_API_KEY is not configured. Public AI chat will show a temporary "
            "unavailability message; admin AI tests will show setup guidance."
        )


@asynccontextmanager
async def lifespan(_: FastAPI):
    log_openai_configuration()
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
