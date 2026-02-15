#!/usr/bin/env python3
"""
Script to create weekly snapshots for all teams for multiple weeks.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.modules.snapshots.services import create_snapshots_for_all_teams
from app.services.calculations import get_current_week


def get_previous_week(current_week: str) -> str:
    """Get previous week string."""
    year, week = current_week.split('-W')
    year = int(year)
    week = int(week)
    
    if week > 1:
        week -= 1
    else:
        year -= 1
        week = 52
    
    return f"{year}-W{week:02d}"


def main():
    """Create snapshots for all teams for current week and previous weeks."""
    db = SessionLocal()
    try:
        current_week = get_current_week()
        weeks = [
            get_previous_week(get_previous_week(get_previous_week(current_week))),  # 3 weeks ago
            get_previous_week(get_previous_week(current_week)),  # 2 weeks ago
            get_previous_week(current_week),  # 1 week ago
            current_week  # Current week
        ]
        
        print(f"Creating snapshots for weeks: {', '.join(weeks)}")
        
        for week in weeks:
            print(f"\n--- Creating snapshots for week {week} ---")
            snapshots = create_snapshots_for_all_teams(db, week=week)
            print(f"✓ Successfully created {len(snapshots)} snapshots for week {week}")
            for snapshot in snapshots:
                print(f"  - Team {snapshot.team_id} ({snapshot.team_name or 'N/A'}): "
                      f"OKR={snapshot.okr_current_score or snapshot.okr_objective_score}, "
                      f"BAU={snapshot.bau_overall_health}, "
                      f"Work Items={snapshot.work_items_count_completed}/{snapshot.work_items_count_planned}, "
                      f"Tasks={snapshot.tasks_count_completed}/{snapshot.tasks_count_planned}")
        
        print(f"\n✓ All snapshots created successfully!")
        
    except Exception as e:
        print(f"✗ Error creating snapshots: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

