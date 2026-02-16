"""
Migration script to update weekly_snapshots table with new columns.

This migration adds the following columns to weekly_snapshots table:
- okr_objective_score (DECIMAL(3,2))
- kr1_score through kr5_score (DECIMAL(3,2))
- bau_overall_health (DECIMAL(5,2))
- work_items_planned, work_items_completed (INTEGER)
- work_items_completion_rate (DECIMAL(5,2))
- tasks_planned, tasks_completed (INTEGER)
- tasks_completion_rate (DECIMAL(5,2))
- team_size (INTEGER)

To run this migration:
    python migrations/update_weekly_snapshots_schema.py
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
    """Add new columns to weekly_snapshots table."""
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            print("Starting weekly_snapshots table migration...")
            
            # Check if table exists
            check_table = text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'weekly_snapshots'
                )
            """)
            result = conn.execute(check_table)
            if not result.scalar():
                print("⚠️  Table 'weekly_snapshots' does not exist. Creating it...")
                conn.commit()
                # Table will be created by SQLAlchemy models, so we can skip
                print("✓ Table will be created automatically by models")
                return
            
            # List of columns to add
            columns_to_add = [
                ("okr_objective_score", "DECIMAL(3,2)"),
                ("kr1_score", "DECIMAL(3,2)"),
                ("kr2_score", "DECIMAL(3,2)"),
                ("kr3_score", "DECIMAL(3,2)"),
                ("kr4_score", "DECIMAL(3,2)"),
                ("kr5_score", "DECIMAL(3,2)"),
                ("bau_overall_health", "DECIMAL(5,2)"),
                ("work_items_planned", "INTEGER NOT NULL DEFAULT 0"),
                ("work_items_completed", "INTEGER NOT NULL DEFAULT 0"),
                ("work_items_completion_rate", "DECIMAL(5,2)"),
                ("tasks_planned", "INTEGER NOT NULL DEFAULT 0"),
                ("tasks_completed", "INTEGER NOT NULL DEFAULT 0"),
                ("tasks_completion_rate", "DECIMAL(5,2)"),
                ("team_size", "INTEGER NOT NULL DEFAULT 0"),
            ]
            
            # Check existing columns
            check_columns = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'weekly_snapshots'
            """)
            result = conn.execute(check_columns)
            existing_columns = {row[0] for row in result}
            
            # Add missing columns
            for column_name, column_type in columns_to_add:
                if column_name not in existing_columns:
                    print(f"Adding column '{column_name}'...")
                    try:
                        alter_query = text(f"""
                            ALTER TABLE weekly_snapshots 
                            ADD COLUMN {column_name} {column_type}
                        """)
                        conn.execute(alter_query)
                        conn.commit()
                        print(f"✓ Added column '{column_name}'")
                    except SQLAlchemyError as e:
                        print(f"⚠️  Error adding column '{column_name}': {e}")
                        conn.rollback()
                else:
                    print(f"✓ Column '{column_name}' already exists")
            
            # Update existing rows to set default values for NOT NULL columns
            print("Updating existing rows with default values...")
            update_query = text("""
                UPDATE weekly_snapshots
                SET 
                    work_items_planned = COALESCE(work_items_planned, 0),
                    work_items_completed = COALESCE(work_items_completed, 0),
                    tasks_planned = COALESCE(tasks_planned, 0),
                    tasks_completed = COALESCE(tasks_completed, 0),
                    team_size = COALESCE(team_size, 0)
                WHERE 
                    work_items_planned IS NULL OR
                    work_items_completed IS NULL OR
                    tasks_planned IS NULL OR
                    tasks_completed IS NULL OR
                    team_size IS NULL
            """)
            conn.execute(update_query)
            conn.commit()
            print("✓ Updated existing rows")
            
            print("✓ Migration completed successfully!")
            
    except SQLAlchemyError as e:
        print(f"Error during migration: {e}")
        sys.exit(1)
    finally:
        engine.dispose()


if __name__ == "__main__":
    migrate()

