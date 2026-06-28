import os

import pytest

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("ADMIN_PASSWORD", "test-admin-password")
os.environ.setdefault("DEMO_OWNER_PASSWORD", "test-owner-password")


@pytest.fixture(autouse=True)
def reset_rate_limiter_state():
    from app.core.rate_limit import limiter

    limiter.reset()
