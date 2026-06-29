from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, inspect


BACKEND_DIR = Path(__file__).resolve().parents[1]


def make_alembic_config(database_url: str | None = None) -> Config:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    if database_url:
        config.set_main_option("sqlalchemy.url", database_url)
    return config


def test_alembic_has_single_head_revision():
    script = ScriptDirectory.from_config(make_alembic_config())

    assert script.get_current_head() == "20260629_0002"


def test_alembic_upgrade_head_creates_current_schema_on_sqlite(tmp_path):
    database_url = f"sqlite:///{tmp_path / 'migration-smoke.db'}"
    config = make_alembic_config(database_url)

    command.upgrade(config, "head")

    engine = create_engine(database_url)
    inspector = inspect(engine)

    assert inspector.has_table("alembic_version")
    assert inspector.has_table("restaurants")
    assert inspector.has_table("restaurant_faqs")
    assert inspector.has_table("knowledge_chunks")
    assert inspector.has_table("orders")
    assert "loading_video_url" in {column["name"] for column in inspector.get_columns("restaurants")}
