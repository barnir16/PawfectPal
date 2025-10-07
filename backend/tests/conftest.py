<<<<<<< HEAD
import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.base import Base

@pytest.fixture(scope="session")
def test_engine():
    """Create a test database engine"""
    SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    return engine

@pytest.fixture(scope="session")
def test_session_factory(test_engine):
    """Create a test session factory"""
    return sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="function")
def test_db(test_engine):
    """Create and drop test database tables for each test"""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(autouse=True)
def setup_test_env():
    """Set up test environment variables"""
    os.environ["TESTING"] = "true"
    os.environ["SECRET_KEY"] = "test-secret-key"
    os.environ["ALGORITHM"] = "HS256"
    os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
    yield
    # Clean up environment variables if needed
    if "TESTING" in os.environ:
        del os.environ["TESTING"]
=======
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
from app.dependencies.db import get_db as rel_get_db

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
async def client(override_get_db):
    """Async test client with overridden DB dependency."""

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# --------------------------------------------------------------------
# 🔁 DB dependency override fixture
# --------------------------------------------------------------------
@pytest.fixture
def override_get_db(db_session):
    """Override both absolute and relative get_db with the test session."""

    def _override():
        try:
            yield db_session
        finally:
            pass

    # Apply overrides
    app.dependency_overrides[app_get_db] = _override
    app.dependency_overrides[rel_get_db] = _override

    try:
        yield
    finally:
        # Remove only the overrides we added
        for key in (app_get_db, rel_get_db):
            try:
                del app.dependency_overrides[key]
            except KeyError:
                pass
>>>>>>> origin/merged-zoroflamingo
