"""Add marketplace functionality to service requests

Revision ID: add_marketplace_functionality
Revises: 182682f16ed6
Create Date: 2025-01-14 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_marketplace_functionality'
down_revision: Union[str, None] = '182682f16ed6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add marketplace functionality to service requests."""
    
    # Add new columns to service_requests table
    op.add_column('service_requests', sa.Column('request_type', sa.String(), nullable=False, server_default='direct'))
    op.add_column('service_requests', sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('service_requests', sa.Column('max_providers', sa.Integer(), nullable=True))
    op.add_column('service_requests', sa.Column('response_deadline', sa.DateTime(), nullable=True))
    op.add_column('service_requests', sa.Column('auto_assign', sa.Boolean(), nullable=False, server_default='false'))
    
    # Create service_request_responses table
    op.create_table('service_request_responses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('service_request_id', sa.Integer(), nullable=False),
        sa.Column('provider_id', sa.Integer(), nullable=False),
        sa.Column('bid_amount', sa.Float(), nullable=True),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()'), onupdate=sa.text('now()')),
        sa.ForeignKeyConstraint(['provider_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['service_request_id'], ['service_requests.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('service_request_id', 'provider_id', name='unique_provider_response')
    )
    
    # Create indexes
    op.create_index(op.f('ix_service_request_responses_id'), 'service_request_responses', ['id'], unique=False)
    op.create_index(op.f('ix_service_request_responses_service_request_id'), 'service_request_responses', ['service_request_id'], unique=False)
    op.create_index(op.f('ix_service_request_responses_provider_id'), 'service_request_responses', ['provider_id'], unique=False)
    op.create_index(op.f('ix_service_request_responses_status'), 'service_request_responses', ['status'], unique=False)


def downgrade() -> None:
    """Remove marketplace functionality."""
    
    # Drop indexes
    op.drop_index(op.f('ix_service_request_responses_status'), table_name='service_request_responses')
    op.drop_index(op.f('ix_service_request_responses_provider_id'), table_name='service_request_responses')
    op.drop_index(op.f('ix_service_request_responses_service_request_id'), table_name='service_request_responses')
    op.drop_index(op.f('ix_service_request_responses_id'), table_name='service_request_responses')
    
    # Drop table
    op.drop_table('service_request_responses')
    
    # Remove columns from service_requests
    op.drop_column('service_requests', 'auto_assign')
    op.drop_column('service_requests', 'response_deadline')
    op.drop_column('service_requests', 'max_providers')
    op.drop_column('service_requests', 'is_public')
    op.drop_column('service_requests', 'request_type')
