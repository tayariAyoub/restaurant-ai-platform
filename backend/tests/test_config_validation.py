from types import SimpleNamespace

from app.core.config import (
    LOCAL_DEMO_JWT_SECRET,
    collect_configuration_issues,
    cors_origins,
    should_run_legacy_startup_migrations,
    should_seed_demo_data,
)


def make_config(**overrides):
    values = {
        "app_env": "development",
        "log_level": "INFO",
        "database_url": "sqlite://",
        "jwt_secret": "development-secret",
        "jwt_algorithm": "HS256",
        "access_token_minutes": 720,
        "admin_password": "safe-development-admin-password",
        "demo_owner_password": "safe-development-owner-password",
        "storage_provider": "local",
        "auto_migrate_on_startup": None,
        "seed_demo_data": False,
        "openai_api_key": "",
        "frontend_origin": None,
        "frontend_url": "http://localhost:3000",
        "auth_cookie_enabled": False,
        "auth_cookie_name": "restaurant_ai_access_token",
        "auth_cookie_secure": False,
        "auth_cookie_samesite": "lax",
        "auth_cookie_max_age_seconds": 43200,
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def test_development_allows_missing_openai_with_warning():
    report = collect_configuration_issues(make_config(openai_api_key=""))

    assert report.errors == []
    assert any("OPENAI_API_KEY" in warning for warning in report.warnings)


def test_production_rejects_demo_secrets():
    report = collect_configuration_issues(
        make_config(
            app_env="production",
            jwt_secret=LOCAL_DEMO_JWT_SECRET,
            admin_password="admin12345",
            demo_owner_password="owner12345",
        )
    )

    assert any("JWT_SECRET" in error for error in report.errors)
    assert any("ADMIN_PASSWORD" in error for error in report.errors)
    assert any("DEMO_OWNER_PASSWORD" in error for error in report.errors)


def test_production_requires_secure_cookie_flag_when_cookie_auth_is_enabled():
    report = collect_configuration_issues(
        make_config(
            app_env="production",
            jwt_secret="production-secret-with-enough-length",
            auth_cookie_enabled=True,
            auth_cookie_secure=False,
        )
    )

    assert "AUTH_COOKIE_SECURE must be true" in " ".join(report.errors)


def test_unknown_storage_provider_is_rejected():
    report = collect_configuration_issues(make_config(storage_provider="s3"))

    assert "STORAGE_PROVIDER" in " ".join(report.errors)


def test_invalid_log_level_is_rejected():
    report = collect_configuration_issues(make_config(log_level="VERBOSE"))

    assert "LOG_LEVEL" in " ".join(report.errors)


def test_production_rejects_sqlite_database():
    report = collect_configuration_issues(
        make_config(
            app_env="production",
            jwt_secret="production-secret-with-enough-length",
            database_url="sqlite://",
        )
    )

    assert "DATABASE_URL" in " ".join(report.errors)


def test_frontend_origin_is_preferred_for_cors():
    config = make_config(
        frontend_origin="https://app.restaurantai.example",
        frontend_url="http://localhost:3000",
    )

    assert cors_origins(config) == ["https://app.restaurantai.example"]


def test_production_rejects_wildcard_frontend_origin():
    report = collect_configuration_issues(
        make_config(
            app_env="production",
            jwt_secret="production-secret-with-enough-length",
            frontend_origin="*",
            database_url="postgresql+psycopg://user:pass@db:5432/app",
        )
    )

    assert "FRONTEND_ORIGIN" in " ".join(report.errors)


def test_production_rejects_insecure_frontend_origin():
    report = collect_configuration_issues(
        make_config(
            app_env="production",
            jwt_secret="production-secret-with-enough-length",
            frontend_origin="http://example.com",
            database_url="postgresql+psycopg://user:pass@db:5432/app",
        )
    )

    assert "FRONTEND_ORIGIN must use HTTPS" in " ".join(report.errors)


def test_frontend_origin_must_not_include_path():
    report = collect_configuration_issues(
        make_config(frontend_origin="https://example.com/admin")
    )

    assert "origin only" in " ".join(report.errors)


def test_invalid_jwt_algorithm_is_rejected():
    report = collect_configuration_issues(make_config(jwt_algorithm="none"))

    assert "JWT_ALGORITHM" in " ".join(report.errors)


def test_placeholder_jwt_secret_is_rejected_in_production():
    report = collect_configuration_issues(
        make_config(
            app_env="production",
            jwt_secret="replace-me-with-a-long-production-secret",
            database_url="postgresql+psycopg://user:pass@db:5432/app",
        )
    )

    assert "JWT_SECRET looks like" in " ".join(report.errors)


def test_cookie_samesite_none_requires_secure_cookie():
    report = collect_configuration_issues(
        make_config(auth_cookie_samesite="none", auth_cookie_secure=False)
    )

    assert "AUTH_COOKIE_SECURE" in " ".join(report.errors)


def test_invalid_cookie_name_is_rejected():
    report = collect_configuration_issues(make_config(auth_cookie_name="bad cookie name"))

    assert "AUTH_COOKIE_NAME" in " ".join(report.errors)


def test_legacy_startup_migrations_run_by_default_outside_production():
    assert should_run_legacy_startup_migrations(make_config(app_env="development")) is True
    assert should_run_legacy_startup_migrations(make_config(app_env="test")) is True


def test_legacy_startup_migrations_do_not_run_in_production():
    assert should_run_legacy_startup_migrations(make_config(app_env="production")) is False


def test_production_rejects_automatic_startup_migrations():
    report = collect_configuration_issues(
        make_config(
            app_env="production",
            jwt_secret="production-secret-with-enough-length",
            auto_migrate_on_startup=True,
        )
    )

    assert "AUTO_MIGRATE_ON_STARTUP" in " ".join(report.errors)


def test_demo_seed_data_is_disabled_by_default():
    assert should_seed_demo_data(make_config(app_env="development")) is False


def test_demo_seed_data_can_be_enabled_for_local_demo():
    assert should_seed_demo_data(make_config(app_env="development", seed_demo_data=True)) is True


def test_demo_seed_data_never_runs_in_production():
    assert should_seed_demo_data(make_config(app_env="production", seed_demo_data=True)) is False


def test_production_rejects_demo_seed_data_flag():
    report = collect_configuration_issues(
        make_config(
            app_env="production",
            jwt_secret="production-secret-with-enough-length",
            database_url="postgresql+psycopg://user:pass@db:5432/app",
            frontend_origin="https://app.example.com",
            frontend_url="https://app.example.com",
            seed_demo_data=True,
        )
    )

    assert "SEED_DEMO_DATA" in " ".join(report.errors)


def test_demo_seed_data_requires_demo_passwords_when_enabled():
    report = collect_configuration_issues(
        make_config(
            seed_demo_data=True,
            admin_password="",
            demo_owner_password="",
        )
    )

    assert "ADMIN_PASSWORD is required when SEED_DEMO_DATA=true" in " ".join(report.errors)
    assert "DEMO_OWNER_PASSWORD is required when SEED_DEMO_DATA=true" in " ".join(report.errors)
