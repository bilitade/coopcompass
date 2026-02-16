"""
Migration script to enhance weekly_snapshots table for comprehensive report generation.

This migration adds all fields specified in the Compass specification (Section 10.2):
- Team context fields (team_name, manager_id, manager_name, team_members)
- OKR context fields (okr_id, okr_objective, okr_target_score, okr_current_score, okr_key_results)
- BAU activities JSONB field
- Work items planned/completed JSONB fields
- Weekly priority plan JSONB field
- Tasks JSONB field
- Snapshot version field

To run this migration:
    python migrations/enhance_weekly_snapshots_for_reports.py
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
    """Add new columns to weekly_snapshots table for comprehensive reporting."""
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            print("Starting weekly_snapshots table enhancement for reports...")
            
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
                print("✓ Table will be created automatically by models")
                return
            
            # List of columns to add
            columns_to_add = [
                # Team Context
                ("team_name", "VARCHAR(255)"),
                ("manager_id", "INTEGER REFERENCES users(id) ON DELETE SET NULL"),
                ("manager_name", "VARCHAR(255)"),
                ("team_members", "JSONB"),
                
                # OKR Context & Scores
                ("okr_id", "INTEGER REFERENCES okrs(id) ON DELETE SET NULL"),
                ("okr_objective", "TEXT"),
                ("okr_target_score", "DECIMAL(3,2)"),
                ("okr_current_score", "DECIMAL(3,2)"),
                ("okr_key_results", "JSONB"),
                
                # BAU Context & Scores
                ("bau_activities", "JSONB"),
                
                # Work Items
                ("work_items_planned", "JSONB"),
                ("work_items_completed", "JSONB"),
                ("work_items_count_planned", "INTEGER NOT NULL DEFAULT 0"),
                ("work_items_count_completed", "INTEGER NOT NULL DEFAULT 0"),
                
                # Weekly Priority Plan
                ("weekly_priority_plan", "JSONB"),
                
                # Tasks
                ("tasks", "JSONB"),
                ("tasks_count_planned", "INTEGER NOT NULL DEFAULT 0"),
                ("tasks_count_completed", "INTEGER NOT NULL DEFAULT 0"),
                
                # Metadata
                ("snapshot_version", "VARCHAR(10) DEFAULT '1.0' NOT NULL"),
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
                    work_items_count_planned = COALESCE(work_items_count_planned, work_items_planned, 0),
                    work_items_count_completed = COALESCE(work_items_count_completed, work_items_completed, 0),
                    tasks_count_planned = COALESCE(tasks_count_planned, tasks_planned, 0),
                    tasks_count_completed = COALESCE(tasks_count_completed, tasks_completed, 0),
                    snapshot_version = COALESCE(snapshot_version, '1.0')
                WHERE 
                    work_items_count_planned IS NULL OR
                    work_items_count_completed IS NULL OR
                    tasks_count_planned IS NULL OR
                    tasks_count_completed IS NULL OR
                    snapshot_version IS NULL
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

