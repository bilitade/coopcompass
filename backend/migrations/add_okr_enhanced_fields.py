"""
Migration script to add enhanced OKR fields.

This migration adds:
- okr_level: strategic, operational, or tactical
- year: numeric year field
- quarters: comma-separated quarters
- description: optional description field

And updates existing OKRs to maintain backward compatibility.

To run this migration:
    python migrations/add_okr_enhanced_fields.py
"""

import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text, Column, Integer, String, Text
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings

settings = get_settings()


def migrate():
    """Run the migration."""
    engine = create_engine(str(settings.DATABASE_URL))
    
    with engine.connect() as conn:
        print("Starting OKR table migration...")
        
        # Check if columns already exist
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'okrs' AND column_name IN ('okr_level', 'year', 'quarters', 'description')
        """))
        existing_columns = [row[0] for row in result]
        
        # Add new columns if they don't exist
        if 'okr_level' not in existing_columns:
            print("Adding okr_level column...")
            conn.execute(text("""
                ALTER TABLE okrs 
                ADD COLUMN okr_level VARCHAR(20) DEFAULT 'strategic' NOT NULL
            """))
            conn.commit()
        else:
            print("okr_level column already exists")
        
        if 'year' not in existing_columns:
            print("Adding year column...")
            conn.execute(text("""
                ALTER TABLE okrs 
                ADD COLUMN year INTEGER
            """))
            conn.commit()
        else:
            print("year column already exists")
        
        if 'quarters' not in existing_columns:
            print("Adding quarters column...")
            conn.execute(text("""
                ALTER TABLE okrs 
                ADD COLUMN quarters VARCHAR(50)
            """))
            conn.commit()
        else:
            print("quarters column already exists")
        
        if 'description' not in existing_columns:
            print("Adding description column...")
            conn.execute(text("""
                ALTER TABLE okrs 
                ADD COLUMN description TEXT
            """))
            conn.commit()
        else:
            print("description column already exists")
        
        # Migrate existing data from quarter field to year and quarters
        print("Migrating existing OKR data...")
        result = conn.execute(text("""
            SELECT id, quarter 
            FROM okrs 
            WHERE quarter IS NOT NULL AND (year IS NULL OR quarters IS NULL)
        """))
        
        okrs_to_update = list(result)
        
        for okr_id, quarter_str in okrs_to_update:
            if quarter_str and ' ' in quarter_str:
                parts = quarter_str.split(' ')
                quarter_part = parts[0]  # e.g., "Q1"
                year_part = int(parts[1])  # e.g., 2026
                
                conn.execute(
                    text("""
                        UPDATE okrs 
                        SET year = :year, quarters = :quarters
                        WHERE id = :id
                    """),
                    {"id": okr_id, "year": year_part, "quarters": quarter_part}
                )
        
        conn.commit()
        print(f"Migrated {len(okrs_to_update)} existing OKRs")
        
        # Make year and quarters NOT NULL after migration
        print("Setting year and quarters as NOT NULL...")
        conn.execute(text("""
            ALTER TABLE okrs 
            ALTER COLUMN year SET NOT NULL
        """))
        conn.execute(text("""
            ALTER TABLE okrs 
            ALTER COLUMN quarters SET NOT NULL
        """))
        conn.commit()
        
        # Drop the old unique constraint if it exists
        print("Updating constraints...")
        try:
            conn.execute(text("""
                ALTER TABLE okrs 
                DROP CONSTRAINT IF EXISTS unique_team_quarter
            """))
            conn.commit()
            print("Dropped old unique_team_quarter constraint")
        except Exception as e:
            print(f"Note: Could not drop constraint (may not exist): {e}")
        
        # Drop old index if it exists
        try:
            conn.execute(text("""
                DROP INDEX IF EXISTS idx_okrs_team_quarter
            """))
            conn.commit()
            print("Dropped old idx_okrs_team_quarter index")
        except Exception as e:
            print(f"Note: Could not drop index (may not exist): {e}")
        
        # Create new indexes
        print("Creating new indexes...")
        try:
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_okrs_team_year 
                ON okrs(team_id, year)
            """))
            conn.commit()
            print("Created idx_okrs_team_year index")
        except Exception as e:
            print(f"Index may already exist: {e}")
        
        try:
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_okrs_level 
                ON okrs(okr_level)
            """))
            conn.commit()
            print("Created idx_okrs_level index")
        except Exception as e:
            print(f"Index may already exist: {e}")
        
        print("Migration completed successfully!")


def rollback():
    """Rollback the migration (optional)."""
    engine = create_engine(str(settings.DATABASE_URL))
    
    with engine.connect() as conn:
        print("Rolling back OKR table migration...")
        
        # Drop new columns
        conn.execute(text("ALTER TABLE okrs DROP COLUMN IF EXISTS okr_level"))
        conn.execute(text("ALTER TABLE okrs DROP COLUMN IF EXISTS year"))
        conn.execute(text("ALTER TABLE okrs DROP COLUMN IF EXISTS quarters"))
        conn.execute(text("ALTER TABLE okrs DROP COLUMN IF EXISTS description"))
        
        # Drop new indexes
        conn.execute(text("DROP INDEX IF EXISTS idx_okrs_team_year"))
        conn.execute(text("DROP INDEX IF EXISTS idx_okrs_level"))
        
        conn.commit()
        print("Rollback completed!")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Migrate OKR table to enhanced schema")
    parser.add_argument(
        "--rollback",
        action="store_true",
        help="Rollback the migration"
    )
    
    args = parser.parse_args()
    
    if args.rollback:
        confirm = input("Are you sure you want to rollback? This will remove the new columns. (yes/no): ")
        if confirm.lower() == "yes":
            rollback()
        else:
            print("Rollback cancelled")
    else:
        migrate()

