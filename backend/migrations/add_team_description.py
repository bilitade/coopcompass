#!/usr/bin/env python3
"""Migration: Add description column to teams table."""

import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Try to get DATABASE_URL from config, fallback to environment
try:
    from app.core.config import DATABASE_URL
except ImportError:
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in config or environment")
        sys.exit(1)

def migrate():
    """Add description column to teams table."""
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Check if column already exists
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'teams' AND column_name = 'description'
            """)
            result = conn.execute(check_query)
            if result.fetchone():
                print("✓ Column 'description' already exists in 'teams' table")
                return
            
            # Add description column
            print("Adding 'description' column to 'teams' table...")
            alter_query = text("""
                ALTER TABLE teams 
                ADD COLUMN description TEXT
            """)
            conn.execute(alter_query)
            conn.commit()
            print("✓ Successfully added 'description' column to 'teams' table")
            
    except SQLAlchemyError as e:
        print(f"Error during migration: {e}")
        sys.exit(1)
    finally:
        engine.dispose()

def rollback():
    """Remove description column from teams table."""
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Check if column exists
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'teams' AND column_name = 'description'
            """)
            result = conn.execute(check_query)
            if not result.fetchone():
                print("Column 'description' does not exist in 'teams' table")
                return
            
            # Remove description column
            print("Removing 'description' column from 'teams' table...")
            alter_query = text("""
                ALTER TABLE teams 
                DROP COLUMN description
            """)
            conn.execute(alter_query)
            conn.commit()
            print("✓ Successfully removed 'description' column from 'teams' table")
            
    except SQLAlchemyError as e:
        print(f"Error during rollback: {e}")
        sys.exit(1)
    finally:
        engine.dispose()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "rollback":
        rollback()
    else:
        migrate()

