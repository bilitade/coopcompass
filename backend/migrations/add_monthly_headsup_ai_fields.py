"""
Migration script to add AI-generated fields to monthly_headsups table.

This migration adds:
- focus_areas (JSON/JSONB): Array of focus area strings
- strategic_alignment (TEXT): Strategic alignment description
- risks_and_considerations (JSON/JSONB): Array of risk/consideration strings

To run this migration:
    python migrations/add_monthly_headsup_ai_fields.py
"""

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
    """Add AI-generated fields to monthly_headsups table."""
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            print("Starting migration: Adding AI fields to monthly_headsups...")
            
            # Check if columns already exist
            check_columns = text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'monthly_headsups'
                AND column_name IN ('focus_areas', 'strategic_alignment', 'risks_and_considerations')
            """)
            result = conn.execute(check_columns)
            existing_columns = {row[0] for row in result}
            
            # Add focus_areas column if it doesn't exist
            if 'focus_areas' not in existing_columns:
                print("Adding focus_areas column...")
                if 'postgresql' in DATABASE_URL.lower():
                    conn.execute(text("""
                        ALTER TABLE monthly_headsups
                        ADD COLUMN focus_areas JSONB
                    """))
                else:
                    # SQLite
                    conn.execute(text("""
                        ALTER TABLE monthly_headsups
                        ADD COLUMN focus_areas JSON
                    """))
                conn.commit()
                print("✓ Added focus_areas column")
            else:
                print("✓ focus_areas column already exists")
            
            # Add strategic_alignment column if it doesn't exist
            if 'strategic_alignment' not in existing_columns:
                print("Adding strategic_alignment column...")
                conn.execute(text("""
                    ALTER TABLE monthly_headsups
                    ADD COLUMN strategic_alignment TEXT
                """))
                conn.commit()
                print("✓ Added strategic_alignment column")
            else:
                print("✓ strategic_alignment column already exists")
            
            # Add risks_and_considerations column if it doesn't exist
            if 'risks_and_considerations' not in existing_columns:
                print("Adding risks_and_considerations column...")
                if 'postgresql' in DATABASE_URL.lower():
                    conn.execute(text("""
                        ALTER TABLE monthly_headsups
                        ADD COLUMN risks_and_considerations JSONB
                    """))
                else:
                    # SQLite
                    conn.execute(text("""
                        ALTER TABLE monthly_headsups
                        ADD COLUMN risks_and_considerations JSON
                    """))
                conn.commit()
                print("✓ Added risks_and_considerations column")
            else:
                print("✓ risks_and_considerations column already exists")
            
            print("\n✅ Migration completed successfully!")
            
    except SQLAlchemyError as e:
        print(f"❌ Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)
    finally:
        engine.dispose()


if __name__ == "__main__":
    migrate()

