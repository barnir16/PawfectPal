"""Create provider_profiles table only

Revision ID: create_provider_profiles_only
Revises: df196bcec88b
Create Date: 2025-01-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'create_provider_profiles_only'
down_revision: Union[str, None] = 'df196bcec88b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create provider_profiles table if it doesn't exist."""
    
    connection = op.get_bind()
    
    # Check if provider_profiles table exists
    if connection.dialect.name == 'postgresql':
        result = connection.execute(sa.text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'provider_profiles'
            );
        """))
        table_exists = result.scalar()
        
        if not table_exists:
            print("Creating provider_profiles table...")
            op.create_table('provider_profiles',
                sa.Column('id', sa.Integer(), nullable=False),
                sa.Column('user_id', sa.Integer(), nullable=False),
                sa.Column('bio', sa.Text(), nullable=True),
                sa.Column('experience_years', sa.Integer(), nullable=True),
                sa.Column('languages', sa.JSON(), nullable=True),
                sa.Column('hourly_rate', sa.Float(), nullable=True),
                sa.Column('service_radius_km', sa.Integer(), nullable=True),
                sa.Column('is_available', sa.Boolean(), nullable=False),
                sa.Column('available_days', sa.JSON(), nullable=True),
                sa.Column('available_hours_start', sa.String(), nullable=True),
                sa.Column('available_hours_end', sa.String(), nullable=True),
                sa.Column('is_verified', sa.Boolean(), nullable=False),
                sa.Column('certifications', sa.JSON(), nullable=True),
                sa.Column('insurance_info', sa.Text(), nullable=True),
                sa.Column('average_rating', sa.Float(), nullable=True),
                sa.Column('total_reviews', sa.Integer(), nullable=False),
                sa.Column('created_at', sa.DateTime(), nullable=False),
                sa.Column('updated_at', sa.DateTime(), nullable=False),
                sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
                sa.PrimaryKeyConstraint('id'),
                sa.UniqueConstraint('user_id')
            )
            op.create_index(op.f('ix_provider_profiles_id'), 'provider_profiles', ['id'], unique=False)
            print("✅ provider_profiles table created successfully")
        else:
            print("✅ provider_profiles table already exists")
    
    elif connection.dialect.name == 'sqlite':
        print("✅ SQLite database - provider_profiles table should already exist")


def downgrade() -> None:
    """Don't drop the table to avoid data loss."""
    print("⚠️ Skipping downgrade to avoid data loss")
    pass
