from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "RestaurantAI API"
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

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
