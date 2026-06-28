from dataclasses import dataclass
from functools import lru_cache
import re
from typing import Any
from urllib.parse import urlparse

from pydantic_settings import BaseSettings, SettingsConfigDict

LOCAL_DEMO_JWT_SECRET = "restaurant_ai_local_demo_secret_change_before_production"
LOCAL_DEMO_PASSWORDS = {"admin12345", "owner12345"}
MIN_PRODUCTION_SECRET_LENGTH = 32
ALLOWED_JWT_ALGORITHMS = {"HS256", "HS384", "HS512"}
ALLOWED_COOKIE_SAMESITE = {"lax", "strict", "none"}
COOKIE_NAME_PATTERN = re.compile(r"^[A-Za-z0-9_.-]{1,80}$")
WEAK_SECRET_MARKERS = {
    "changeme",
    "change-me",
    "change_before_production",
    "development-secret",
    "local_demo",
    "password",
    "replace-me",
    "replace_me",
    "test-secret",
}


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
    frontend_origin: str | None = None
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
    rate_limit_auth_per_minute: int = 10
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


def configured_frontend_origin(config: Any) -> str:
    return _clean(getattr(config, "frontend_origin", "")) or _clean(
        getattr(config, "frontend_url", "")
    )


def cors_origins(config: Any) -> list[str]:
    origin = configured_frontend_origin(config)
    return [origin] if origin else []


def _is_localhost(hostname: str | None) -> bool:
    return hostname in {"localhost", "127.0.0.1", "::1"}


def _validate_frontend_origin(config: Any, errors: list[str], warnings: list[str]) -> None:
    origin = configured_frontend_origin(config)
    if not origin:
        errors.append("FRONTEND_ORIGIN or FRONTEND_URL is required.")
        return
    if origin == "*":
        if _is_production(config):
            errors.append("FRONTEND_ORIGIN must not be '*' in production.")
        else:
            warnings.append("FRONTEND_ORIGIN='*' is not recommended; use an explicit local origin.")
        return

    parsed = urlparse(origin)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        errors.append("FRONTEND_ORIGIN must be a valid http(s) origin, for example https://example.com.")
        return
    if parsed.path not in {"", "/"} or parsed.params or parsed.query or parsed.fragment:
        errors.append("FRONTEND_ORIGIN must be an origin only; do not include path, query, or fragment.")
    if _is_production(config):
        if parsed.scheme != "https":
            errors.append("FRONTEND_ORIGIN must use HTTPS in production.")
        if _is_localhost(parsed.hostname):
            errors.append("FRONTEND_ORIGIN must not point to localhost in production.")


def _validate_auth_settings(config: Any, errors: list[str], warnings: list[str]) -> None:
    jwt_algorithm = _clean(getattr(config, "jwt_algorithm", "HS256")).upper()
    if jwt_algorithm not in ALLOWED_JWT_ALGORITHMS:
        errors.append("JWT_ALGORITHM must be HS256, HS384, or HS512.")

    access_token_minutes = int(getattr(config, "access_token_minutes", 0) or 0)
    if access_token_minutes <= 0:
        errors.append("ACCESS_TOKEN_MINUTES must be greater than zero.")
    elif _is_production(config) and access_token_minutes > 1440:
        errors.append("ACCESS_TOKEN_MINUTES must be 1440 or less in production.")

    cookie_name = _clean(getattr(config, "auth_cookie_name", ""))
    if cookie_name and not COOKIE_NAME_PATTERN.fullmatch(cookie_name):
        errors.append("AUTH_COOKIE_NAME may only contain letters, numbers, dots, underscores, and hyphens.")

    same_site = _clean(getattr(config, "auth_cookie_samesite", "lax")).lower()
    if same_site not in ALLOWED_COOKIE_SAMESITE:
        errors.append("AUTH_COOKIE_SAMESITE must be lax, strict, or none.")

    max_age = int(getattr(config, "auth_cookie_max_age_seconds", 0) or 0)
    if max_age <= 0:
        errors.append("AUTH_COOKIE_MAX_AGE_SECONDS must be greater than zero.")

    auth_cookie_enabled = bool(getattr(config, "auth_cookie_enabled", False))
    auth_cookie_secure = bool(getattr(config, "auth_cookie_secure", False))
    if _is_production(config) and auth_cookie_enabled and not auth_cookie_secure:
        errors.append("AUTH_COOKIE_SECURE must be true when cookie auth is enabled in production.")
    if same_site == "none" and not auth_cookie_secure:
        errors.append("AUTH_COOKIE_SECURE must be true when AUTH_COOKIE_SAMESITE=none.")


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
        lowered_secret = jwt_secret.lower()
        if any(marker in lowered_secret for marker in WEAK_SECRET_MARKERS):
            _add_security_issue(config, errors, warnings, "JWT_SECRET looks like a weak or placeholder value.")

    _validate_auth_settings(config, errors, warnings)

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
        if frontend_url and (not frontend_url.lower().startswith("https://")):
            warnings.append("FRONTEND_URL should use HTTPS in production.")
        if "localhost" in frontend_url or "127.0.0.1" in frontend_url:
            warnings.append("FRONTEND_URL should not point to localhost in production.")

    _validate_frontend_origin(config, errors, warnings)

    return ConfigurationReport(errors=errors, warnings=warnings)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
