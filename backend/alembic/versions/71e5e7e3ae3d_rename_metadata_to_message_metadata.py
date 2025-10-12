"""rename_metadata_to_message_metadata

Revision ID: 71e5e7e3ae3d
Revises: e395c9cc6540
Create Date: 2025-10-05 20:31:25.590972

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '71e5e7e3ae3d'
down_revision: Union[str, None] = 'e395c9cc6540'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('chat_messages', 'metadata', new_column_name='message_metadata')


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('chat_messages', 'message_metadata', new_column_name='metadata')