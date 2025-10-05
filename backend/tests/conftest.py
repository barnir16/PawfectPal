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
