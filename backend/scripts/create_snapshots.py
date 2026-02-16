#!/usr/bin/env python3
"""
Script to create weekly snapshots for all teams.

This script can be run manually or scheduled via cron:
    # Run every Friday at 5:00 PM
    0 17 * * 5 cd /path/to/backend && python scripts/create_snapshots.py

Or use with a task scheduler like systemd, supervisor, etc.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.modules.snapshots import services
from app.services.calculations import get_current_week


def main():
    """Create snapshots for all teams."""
    db = SessionLocal()
    try:
        print(f"Creating weekly snapshots for all teams (week: {get_current_week()})...")
        snapshots = services.create_snapshots_for_all_teams(db)
        print(f"✓ Successfully created {len(snapshots)} snapshots")
        for snapshot in snapshots:
            print(f"  - Team {snapshot.team_id}: OKR={snapshot.okr_objective_score}, BAU={snapshot.bau_overall_health}")
    except Exception as e:
        print(f"✗ Error creating snapshots: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

