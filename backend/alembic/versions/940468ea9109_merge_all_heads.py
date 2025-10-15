"""merge_all_heads

Revision ID: 940468ea9109
Revises: 1c27bfdb3047
Create Date: 2025-10-15 19:17:59.185446

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '940468ea9109'
down_revision: Union[str, None] = '1c27bfdb3047'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
