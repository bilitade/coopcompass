"""
Migration script to add title column to tasks table.

This migration:
- Adds title column to tasks table
- Populates existing tasks with a title derived from description (first line or truncated)
- Makes title NOT NULL

To run this migration:
    python migrations/add_task_title.py
"""

import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import DATABASE_URL


def migrate():
    """Run the migration."""
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Starting tasks table migration...")
        
        # Check if title column already exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'tasks' AND column_name = 'title'
        """))
        existing_columns = [row[0] for row in result]
        
        # Add title column if it doesn't exist
        if 'title' not in existing_columns:
            print("Adding title column...")
            # First add as nullable
            conn.execute(text("""
                ALTER TABLE tasks 
                ADD COLUMN title VARCHAR(255)
            """))
            conn.commit()
            print("✓ Added title column")
        else:
            print("title column already exists")
        
        # Populate existing tasks with title from description
        print("Populating existing tasks with titles...")
        result = conn.execute(text("""
            SELECT id, description 
            FROM tasks 
            WHERE title IS NULL OR title = ''
        """))
        
        tasks_to_update = list(result)
        
        for task_id, description in tasks_to_update:
            if description:
                # Use first line of description or first 100 chars as title
                title = description.split('\n')[0].strip()
                if len(title) > 255:
                    title = title[:252] + "..."
                if not title:
                    title = "Task " + str(task_id)
            else:
                title = "Task " + str(task_id)
            
            conn.execute(
                text("""
                    UPDATE tasks 
                    SET title = :title
                    WHERE id = :id
                """),
                {"id": task_id, "title": title}
            )
        
        conn.commit()
        print(f"✓ Updated {len(tasks_to_update)} existing tasks with titles")
        
        # Make title NOT NULL after migration
        print("Setting title as NOT NULL...")
        try:
            conn.execute(text("""
                ALTER TABLE tasks 
                ALTER COLUMN title SET NOT NULL
            """))
            conn.commit()
            print("✓ Set title as NOT NULL")
        except Exception as e:
            print(f"⚠ Warning: Could not set title as NOT NULL: {e}")
            print("  You may need to update remaining NULL titles manually")
        
        print("Migration completed successfully!")


def rollback():
    """Rollback the migration (optional)."""
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Rolling back tasks table migration...")
        
        # Drop title column
        try:
            conn.execute(text("ALTER TABLE tasks DROP COLUMN IF EXISTS title"))
            conn.commit()
            print("✓ Dropped title column")
        except Exception as e:
            print(f"⚠ Error dropping column: {e}")
        
        print("Rollback completed!")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Migrate tasks table to add title column")
    parser.add_argument(
        "--rollback",
        action="store_true",
        help="Rollback the migration"
    )
    
    args = parser.parse_args()
    
    if args.rollback:
        confirm = input("Are you sure you want to rollback? This will remove the title column. (yes/no): ")
        if confirm.lower() == "yes":
            rollback()
        else:
            print("Rollback cancelled")
    else:
        migrate()

