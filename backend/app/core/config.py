from dataclasses import dataclass
from functools import lru_cache
from typing import Any

from pydantic_settings import BaseSettings, SettingsConfigDict

LOCAL_DEMO_JWT_SECRET = "restaurant_ai_local_demo_secret_change_before_production"
LOCAL_DEMO_PASSWORDS = {"admin12345", "owner12345"}
MIN_PRODUCTION_SECRET_LENGTH = 32


class Settings(BaseSettings):
    app_name: str = "RestaurantAI API"
    app_version: str = "0.1.0"
    app_env: str = "development"
    log_level: str = "INFO"
    api_prefix: str = "/api"
    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 720
    openai_api_key: str | None = None
    openai_chat_model: str = "gpt-4.1-mini"
    openai_embedding_model: str = "text-embedding-3-small"
    frontend_url: str = "http://localhost:3000"
    admin_email: str = "admin@example.com"
    admin_password: str
    demo_owner_email: str = "owner@example.com"
    demo_owner_password: str
    upload_dir: str = "uploads"
    storage_provider: str = "local"
    auto_migrate_on_startup: bool | None = None
    rate_limit_chat_per_minute: int = 10
    rate_limit_reservations_per_minute: int = 5
    rate_limit_orders_per_minute: int = 10
    rate_limit_public_per_minute: int = 100
    trust_proxy_headers: bool = False
    auth_cookie_enabled: bool = False
    auth_cookie_name: str = "restaurant_ai_access_token"
    auth_cookie_secure: bool = False
    auth_cookie_samesite: str = "lax"
    auth_cookie_max_age_seconds: int = 43200

    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")


@dataclass(frozen=True)
class ConfigurationReport:
    errors: list[str]
    warnings: list[str]


def _clean(value: Any) -> str:
    return str(value or "").strip()


def _is_production(config: Any) -> bool:
    return _clean(getattr(config, "app_env", "")).lower() in {"production", "prod"}


def _add_security_issue(config: Any, errors: list[str], warnings: list[str], message: str) -> None:
    if _is_production(config):
        errors.append(message)
    else:
        warnings.append(message)


def should_run_legacy_startup_migrations(config: Any) -> bool:
    if _is_production(config):
        return False
    explicit_value = getattr(config, "auto_migrate_on_startup", None)
    if explicit_value is not None:
        return bool(explicit_value)
    return True


def collect_configuration_issues(config: Any) -> ConfigurationReport:
    errors: list[str] = []
    warnings: list[str] = []

    required_values = {
        "DATABASE_URL": "database_url",
        "JWT_SECRET": "jwt_secret",
        "ADMIN_PASSWORD": "admin_password",
        "DEMO_OWNER_PASSWORD": "demo_owner_password",
    }
    for env_name, attr_name in required_values.items():
        if not _clean(getattr(config, attr_name, "")):
            errors.append(f"{env_name} is required.")

    log_level = _clean(getattr(config, "log_level", "INFO")).upper()
    if log_level not in {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}:
        errors.append("LOG_LEVEL must be DEBUG, INFO, WARNING, ERROR, or CRITICAL.")

    database_url = _clean(getattr(config, "database_url", ""))
    if _is_production(config) and database_url.startswith("sqlite"):
        errors.append("DATABASE_URL must not use SQLite in production.")

    jwt_secret = _clean(getattr(config, "jwt_secret", ""))
    if jwt_secret:
        if len(jwt_secret) < MIN_PRODUCTION_SECRET_LENGTH:
            _add_security_issue(
                config,
                errors,
                warnings,
                f"JWT_SECRET should be at least {MIN_PRODUCTION_SECRET_LENGTH} characters.",
            )
        if jwt_secret == LOCAL_DEMO_JWT_SECRET:
            _add_security_issue(config, errors, warnings, "JWT_SECRET is using the local demo value.")

    for env_name, attr_name in {
        "ADMIN_PASSWORD": "admin_password",
        "DEMO_OWNER_PASSWORD": "demo_owner_password",
    }.items():
        if _clean(getattr(config, attr_name, "")) in LOCAL_DEMO_PASSWORDS:
            _add_security_issue(config, errors, warnings, f"{env_name} is using a local demo value.")

    storage_provider = _clean(getattr(config, "storage_provider", "local")).lower()
    if storage_provider != "local":
        errors.append("STORAGE_PROVIDER currently supports only 'local'.")

    if _is_production(config) and getattr(config, "auto_migrate_on_startup", None) is True:
        errors.append("AUTO_MIGRATE_ON_STARTUP must be false in production. Run Alembic migrations explicitly.")

    if not _clean(getattr(config, "openai_api_key", "")):
        warnings.append(
            "OPENAI_API_KEY is not configured; public AI chat will show a temporary unavailable message."
        )

    if _is_production(config):
        frontend_url = _clean(getattr(config, "frontend_url", ""))
        if frontend_url and not frontend_url.lower().startswith("https://"):
            warnings.append("FRONTEND_URL should use HTTPS in production.")
        if "localhost" in frontend_url or "127.0.0.1" in frontend_url:
            warnings.append("FRONTEND_URL should not point to localhost in production.")

        auth_cookie_enabled = bool(getattr(config, "auth_cookie_enabled", False))
        auth_cookie_secure = bool(getattr(config, "auth_cookie_secure", False))
        if auth_cookie_enabled and not auth_cookie_secure:
            errors.append("AUTH_COOKIE_SECURE must be true when cookie auth is enabled in production.")

    return ConfigurationReport(errors=errors, warnings=warnings)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
