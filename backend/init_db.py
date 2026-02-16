"""Database initialization script - Recreates all tables from models."""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.models.base import Base
from app.core.database import engine

# Import all models to ensure they're registered
from app.models import *

def init_db():
    """Drop all tables and recreate them."""
    # For circular dependencies, we need to drop constraints first
    with engine.begin() as connection:
        print("Dropping all existing tables...")
        try:
            # Drop all tables with CASCADE to handle circular dependencies
            connection.execute(text("DROP SCHEMA public CASCADE"))
            connection.execute(text("CREATE SCHEMA public"))
            connection.execute(text("GRANT ALL ON SCHEMA public TO postgres"))
            connection.execute(text("GRANT ALL ON SCHEMA public TO public"))
            print("✓ Successfully dropped all tables")
        except Exception as e:
            print(f"Note: {e}")
    
    print("Creating all tables from models...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database initialized successfully!")

if __name__ == "__main__":
    init_db()
