"""merge_all_heads

Revision ID: 1c27bfdb3047
Revises: add_marketplace_functionality, bce99ce15ee5
Create Date: 2025-10-15 18:52:50.219593

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1c27bfdb3047'
down_revision: Union[str, None] = ('add_marketplace_functionality', 'bce99ce15ee5')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
