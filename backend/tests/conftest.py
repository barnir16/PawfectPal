import os

os.environ["TEST_ENV"] = "1"
from pathlib import Path
from dotenv import load_dotenv
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# --------------------------------------------------------------------
# 🔧 Load environment and test DB URL BEFORE importing the app
# --------------------------------------------------------------------
BACKEND_DIR = Path(__file__).parent.parent
load_dotenv(BACKEND_DIR / ".env")
print("Loaded TEST_DB_URL:", os.getenv("TEST_DB_URL"))
TEST_DATABASE_URL = os.getenv("TEST_DB_URL")
assert TEST_DATABASE_URL, "TEST_DB_URL environment variable must be set"

# Now import the app and Base (they may read DATABASE_URL on import)
from app.main import app
from app.models import Base

# Also import both possible get_db callables (absolute and relative import paths)
from app.dependencies.db import get_db as app_get_db

# --------------------------------------------------------------------
# 🧱 Create dedicated engine and session for testing
# --------------------------------------------------------------------
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

print("✅ Using test DB:", engine.url)


# --------------------------------------------------------------------
# 🧹 Reset DB schema before each test
# --------------------------------------------------------------------
@pytest.fixture(scope="function", autouse=True)
def setup_test_db():
    """Drop and recreate all tables for a clean slate each test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


# --------------------------------------------------------------------
# 🧩 DB session fixture
# --------------------------------------------------------------------
@pytest.fixture(scope="function")
def db_session():
    """Provide a transaction-scoped SQLAlchemy session."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


# --------------------------------------------------------------------
# 🚀 Async test client fixture
# --------------------------------------------------------------------
@pytest_asyncio.fixture
async def client(db_session):
    """Async test client with overridden DB dependency."""

    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()

    # Override both absolute and relative imports of get_db
    app.dependency_overrides[app_get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
