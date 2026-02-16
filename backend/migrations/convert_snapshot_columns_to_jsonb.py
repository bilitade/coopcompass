"""
Migration script to convert work_items_planned and work_items_completed from INTEGER to JSONB.

This migration:
- Checks if work_items_planned/work_items_completed are INTEGER
- If so, renames them to temporary names
- Creates new JSONB columns with the original names
- Copies count values to work_items_count_planned/completed
- Drops the temporary columns

To run this migration:
    python migrations/convert_snapshot_columns_to_jsonb.py
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
    """Convert INTEGER columns to JSONB for work items."""
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            print("Starting conversion of work_items columns to JSONB...")
            
            # Check column types
            check_types = text("""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = 'weekly_snapshots'
                AND column_name IN ('work_items_planned', 'work_items_completed', 'tasks_planned', 'tasks_completed')
            """)
            result = conn.execute(check_types)
            column_types = {row[0]: row[1] for row in result}
            
            # Handle work_items_planned
            if 'work_items_planned' in column_types:
                if column_types['work_items_planned'] == 'integer':
                    print("Converting work_items_planned from INTEGER to JSONB...")
                    # Copy count to count column if not already set
                    conn.execute(text("""
                        UPDATE weekly_snapshots
                        SET work_items_count_planned = COALESCE(work_items_count_planned, work_items_planned, 0)
                        WHERE work_items_count_planned IS NULL OR work_items_count_planned = 0
                    """))
                    conn.commit()
                    
                    # Rename old column
                    conn.execute(text("""
                        ALTER TABLE weekly_snapshots
                        RENAME COLUMN work_items_planned TO work_items_planned_old
                    """))
                    conn.commit()
                    
                    # Create new JSONB column
                    conn.execute(text("""
                        ALTER TABLE weekly_snapshots
                        ADD COLUMN work_items_planned JSONB
                    """))
                    conn.commit()
                    
                    # Drop old column
                    conn.execute(text("""
                        ALTER TABLE weekly_snapshots
                        DROP COLUMN work_items_planned_old
                    """))
                    conn.commit()
                    print("✓ Converted work_items_planned to JSONB")
                else:
                    print("✓ work_items_planned is already JSONB")
            
            # Handle work_items_completed
            if 'work_items_completed' in column_types:
                if column_types['work_items_completed'] == 'integer':
                    print("Converting work_items_completed from INTEGER to JSONB...")
                    # Copy count to count column if not already set
                    conn.execute(text("""
                        UPDATE weekly_snapshots
                        SET work_items_count_completed = COALESCE(work_items_count_completed, work_items_completed, 0)
                        WHERE work_items_count_completed IS NULL OR work_items_count_completed = 0
                    """))
                    conn.commit()
                    
                    # Rename old column
                    conn.execute(text("""
                        ALTER TABLE weekly_snapshots
                        RENAME COLUMN work_items_completed TO work_items_completed_old
                    """))
                    conn.commit()
                    
                    # Create new JSONB column
                    conn.execute(text("""
                        ALTER TABLE weekly_snapshots
                        ADD COLUMN work_items_completed JSONB
                    """))
                    conn.commit()
                    
                    # Drop old column
                    conn.execute(text("""
                        ALTER TABLE weekly_snapshots
                        DROP COLUMN work_items_completed_old
                    """))
                    conn.commit()
                    print("✓ Converted work_items_completed to JSONB")
                else:
                    print("✓ work_items_completed is already JSONB")
            
            # Handle tasks_planned (keep as INTEGER for legacy, but ensure tasks_count_planned is set)
            if 'tasks_planned' in column_types:
                print("Ensuring tasks_count_planned is set from tasks_planned...")
                conn.execute(text("""
                    UPDATE weekly_snapshots
                    SET tasks_count_planned = COALESCE(tasks_count_planned, tasks_planned, 0)
                    WHERE tasks_count_planned IS NULL OR tasks_count_planned = 0
                """))
                conn.commit()
                print("✓ Updated tasks_count_planned")
            
            # Handle tasks_completed (keep as INTEGER for legacy, but ensure tasks_count_completed is set)
            if 'tasks_completed' in column_types:
                print("Ensuring tasks_count_completed is set from tasks_completed...")
                conn.execute(text("""
                    UPDATE weekly_snapshots
                    SET tasks_count_completed = COALESCE(tasks_count_completed, tasks_completed, 0)
                    WHERE tasks_count_completed IS NULL OR tasks_count_completed = 0
                """))
                conn.commit()
                print("✓ Updated tasks_count_completed")
            
            print("✓ Migration completed successfully!")
            
    except SQLAlchemyError as e:
        print(f"Error during migration: {e}")
        sys.exit(1)
    finally:
        engine.dispose()


if __name__ == "__main__":
    migrate()

