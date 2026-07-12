"""merge provider_profile parallel migration branches

Revision ID: merge_provider_profile_heads
Revises: create_provider_profiles_only, fix_provider_profiles_production
Create Date: 2026-04-12

Two migrations both had down_revision df196bcec88b; this merge restores a single Alembic head.
"""
from typing import Sequence, Union

from alembic import op  # noqa: F401  # kept for consistency with other revisions
import sqlalchemy as sa  # noqa: F401


revision: str = "merge_provider_profile_heads"
down_revision: Union[str, None, tuple] = (
    "create_provider_profiles_only",
    "fix_provider_profiles_production",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
