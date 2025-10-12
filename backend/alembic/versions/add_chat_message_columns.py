"""Add missing chat message columns

Revision ID: add_chat_message_columns
Revises: 71e5e7e3ae3d
Create Date: 2025-10-11 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_chat_message_columns'
down_revision: Union[str, None] = '71e5e7e3ae3d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add missing columns to chat_messages table."""
    # Add delivery_status column
    op.add_column('chat_messages', sa.Column('delivery_status', sa.String(), nullable=True))
    
    # Add delivered_at column
    op.add_column('chat_messages', sa.Column('delivered_at', sa.DateTime(), nullable=True))
    
    # Add read_at column
    op.add_column('chat_messages', sa.Column('read_at', sa.DateTime(), nullable=True))
    
    # Set default values for existing rows
    op.execute("UPDATE chat_messages SET delivery_status = 'sent' WHERE delivery_status IS NULL")
    
    # Make delivery_status NOT NULL after setting defaults
    op.alter_column('chat_messages', 'delivery_status', nullable=False)


def downgrade() -> None:
    """Remove added columns from chat_messages table."""
    op.drop_column('chat_messages', 'read_at')
    op.drop_column('chat_messages', 'delivered_at')
    op.drop_column('chat_messages', 'delivery_status')
