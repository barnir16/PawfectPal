"""merge_all_heads

Revision ID: df196bcec88b
Revises: 940468ea9109
Create Date: 2025-10-15 19:26:27.505252

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'df196bcec88b'
down_revision: Union[str, None] = '940468ea9109'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
