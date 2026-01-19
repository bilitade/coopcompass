"""Pytest configuration and fixtures."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Test database setup
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"


@pytest.fixture(scope="session")
def db_engine():
    """Create a test database engine."""
    engine = create_engine(
        SQLALCHEMY_TEST_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    return engine


@pytest.fixture(scope="function")
def db_session(db_engine):
    """Create a test database session."""
    from app.models import Base
    
    Base.metadata.create_all(bind=db_engine)
    
    Session = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = Session()
    
    yield session
    
    session.close()
    Base.metadata.drop_all(bind=db_engine)

