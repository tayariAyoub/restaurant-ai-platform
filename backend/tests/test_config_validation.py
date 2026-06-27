from types import SimpleNamespace

from app.core.config import (
    LOCAL_DEMO_JWT_SECRET,
    collect_configuration_issues,
    should_run_legacy_startup_migrations,
)


def make_config(**overrides):
    values = {
        "app_env": "development",
        "database_url": "sqlite://",
        "jwt_secret": "development-secret",
        "admin_password": "safe-development-admin-password",
        "demo_owner_password": "safe-development-owner-password",
        "storage_provider": "local",
        "auto_migrate_on_startup": None,
        "openai_api_key": "",
        "frontend_url": "http://localhost:3000",
        "auth_cookie_enabled": False,
        "auth_cookie_secure": False,
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
