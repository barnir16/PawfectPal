from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base
from config import DATABASE_URL

# Create engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # pool_pre_ping checks each connection before use and transparently replaces
    # dead ones (Railway's public DB proxy can silently drop idle connections).
    # pool_recycle forces connections to be replaced before they go stale.
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Only create tables automatically in local/test mode
if DATABASE_URL.startswith("sqlite") or "TEST_DB_URL" in DATABASE_URL:
    Base.metadata.create_all(bind=engine)
