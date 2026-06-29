"""Add restaurant loading video URL.

Revision ID: 20260629_0002
Revises: 20260627_0001
Create Date: 2026-06-29
"""

from alembic import op
import sqlalchemy as sa


revision = "20260629_0002"
down_revision = "20260627_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "restaurants",
        sa.Column("loading_video_url", sa.String(length=500), nullable=False, server_default=""),
    )
    op.add_column(
        "restaurants",
        sa.Column("loading_video_filename", sa.String(length=255), nullable=False, server_default=""),
    )
    op.add_column(
        "restaurants",
        sa.Column("loading_video_size_bytes", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("restaurants", "loading_video_size_bytes")
    op.drop_column("restaurants", "loading_video_filename")
    op.drop_column("restaurants", "loading_video_url")
