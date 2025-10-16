from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base
from config import DATABASE_URL

# Create engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Only create tables automatically in local/test mode
if DATABASE_URL.startswith("sqlite") or "TEST_DB_URL" in DATABASE_URL:
    Base.metadata.create_all(bind=engine)
