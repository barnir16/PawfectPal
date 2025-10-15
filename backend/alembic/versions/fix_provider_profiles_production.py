"""Fix provider_profiles table in production

Revision ID: fix_provider_profiles_production
Revises: df196bcec88b
Create Date: 2025-01-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fix_provider_profiles_production'
down_revision: Union[str, None] = 'df196bcec88b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - ensure provider_profiles table exists."""
    
    # Check if provider_profiles table exists, if not create it
    connection = op.get_bind()
    
    # For PostgreSQL, check if table exists
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
            print("Creating provider_profiles table in PostgreSQL...")
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
    
    # For SQLite, the table should already exist from previous migrations
    elif connection.dialect.name == 'sqlite':
        print("✅ SQLite database - provider_profiles table should already exist")
    
    # Ensure provider_profile_services table exists
    if connection.dialect.name == 'postgresql':
        result = connection.execute(sa.text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'provider_profile_services'
            );
        """))
        table_exists = result.scalar()
        
        if not table_exists:
            print("Creating provider_profile_services table in PostgreSQL...")
            op.create_table('provider_profile_services',
                sa.Column('provider_profile_id', sa.Integer(), nullable=False),
                sa.Column('service_type_id', sa.Integer(), nullable=False),
                sa.ForeignKeyConstraint(['provider_profile_id'], ['provider_profiles.id'], ),
                sa.ForeignKeyConstraint(['service_type_id'], ['service_types.id'], ),
                sa.PrimaryKeyConstraint('provider_profile_id', 'service_type_id')
            )
            print("✅ provider_profile_services table created successfully")
        else:
            print("✅ provider_profile_services table already exists")


def downgrade() -> None:
    """Downgrade schema."""
    # Don't drop tables in downgrade to avoid data loss
    print("⚠️ Skipping downgrade to avoid data loss")
    pass
