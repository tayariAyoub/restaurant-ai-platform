from sqlalchemy import text

from app.core.database import engine


def upgrade_existing_database() -> None:
    """Small idempotent bridge for the original MVP database.

    A production deployment should move these statements into Alembic revisions.
    """
    statements = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(160) NOT NULL DEFAULT ''",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(30) NOT NULL DEFAULT 'RESTAURANT_OWNER'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE",
        "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL",
        "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS theme_id INTEGER REFERENCES themes(id) ON DELETE SET NULL",
        "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS slug VARCHAR(180)",
        "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS story TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS google_maps_url VARCHAR(1000) NOT NULL DEFAULT ''",
        "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(500) NOT NULL DEFAULT ''",
        "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500) NOT NULL DEFAULT ''",
        "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(500) NOT NULL DEFAULT ''",
        "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500) NOT NULL DEFAULT ''",
        "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS primary_color VARCHAR(20) NOT NULL DEFAULT ''",
        "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(20) NOT NULL DEFAULT ''",
        "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS background_color VARCHAR(20) NOT NULL DEFAULT ''",
        "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS text_color VARCHAR(20) NOT NULL DEFAULT ''",
        "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS font_family VARCHAR(120) NOT NULL DEFAULT ''",
        "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS button_style VARCHAR(40) NOT NULL DEFAULT ''",
        "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS homepage_style VARCHAR(40) NOT NULL DEFAULT ''",
        "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS menu_style VARCHAR(40) NOT NULL DEFAULT ''",
        "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS gallery_style VARCHAR(40) NOT NULL DEFAULT ''",
        "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE",
        "ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
        "ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_unanswered BOOLEAN NOT NULL DEFAULT FALSE",
        "UPDATE restaurants SET slug = 'restaurant-' || id WHERE slug IS NULL OR slug = ''",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_restaurants_slug ON restaurants(slug)",
        "CREATE INDEX IF NOT EXISTS ix_restaurants_owner_id ON restaurants(owner_id)",
    ]
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))
