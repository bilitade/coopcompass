"""Snapshot routers."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.v1.deps import get_current_user, get_current_team_lead
from app.models import User, Team, WeeklySnapshot
from app.modules.snapshots import schemas
from app.modules.snapshots import services

router = APIRouter(prefix="/api/snapshots", tags=["snapshots"])


@router.post("/teams/{team_id}/create", response_model=schemas.WeeklySnapshotResponse)
def create_snapshot(
    team_id: int,
    week: Optional[str] = Query(None, description="Week in ISO format (e.g., 2026-W07). If not provided, uses current week."),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a weekly snapshot for a team.
    
    Only team leads/managers can create snapshots for their own team.
    Admins can create snapshots for any team.
    """
    # Check team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Authorization: Only team leads can create snapshots for their team
    if current_user.role not in ["admin", "lead"]:
        raise HTTPException(status_code=403, detail="Only team leads and admins can create snapshots")
    
    if current_user.role == "lead" and current_user.team_id != team_id:
        raise HTTPException(status_code=403, detail="You can only create snapshots for your own team")
    
    try:
        snapshot = services.create_weekly_snapshot(db, team_id, week)
        return snapshot
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error creating snapshot: {error_details}")  # Log to console
        raise HTTPException(status_code=500, detail=f"Error creating snapshot: {str(e)}")


@router.get("/teams/{team_id}", response_model=schemas.WeeklySnapshotListResponse)
def get_team_snapshots(
    team_id: int,
    quarter: Optional[str] = Query(None, description="Filter by quarter (e.g., Q1 2026)"),
    limit: Optional[int] = Query(None, description="Limit number of results"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all snapshots for a team.
    
    Team members can view snapshots for their own team.
    Directors can view snapshots for teams in their department.
    Executives and admins can view all snapshots.
    """
    # Check team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Authorization
    if current_user.role == "director":
        if not team.department_id:
            raise HTTPException(status_code=403, detail="Access denied")
        from app.models import Department
        department = db.query(Department).filter(Department.id == team.department_id).first()
        if not department or department.director_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role in ["member", "lead"]:
        if current_user.team_id != team_id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role not in ["admin", "executive"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    snapshots = services.get_team_snapshots(db, team_id, quarter, limit)
    
    return {
        "snapshots": snapshots,
        "total": len(snapshots)
    }


@router.get("/teams/{team_id}/week/{week}", response_model=schemas.WeeklySnapshotResponse)
def get_snapshot_by_week(
    team_id: int,
    week: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific snapshot by team and week."""
    # Check team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Authorization (same as get_team_snapshots)
    if current_user.role == "director":
        if not team.department_id:
            raise HTTPException(status_code=403, detail="Access denied")
        from app.models import Department
        department = db.query(Department).filter(Department.id == team.department_id).first()
        if not department or department.director_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role in ["member", "lead"]:
        if current_user.team_id != team_id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role not in ["admin", "executive"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    snapshot = services.get_snapshot_by_week(db, team_id, week)
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    return snapshot


@router.get("/teams/{team_id}/trends", response_model=List[schemas.SnapshotTrendResponse])
def get_snapshot_trends(
    team_id: int,
    quarter: Optional[str] = Query(None, description="Filter by quarter (e.g., Q1 2026)"),
    limit: Optional[int] = Query(20, description="Number of weeks to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get snapshot trends for a team (simplified data for charts).
    
    Returns OKR score, BAU health, and completion rates over time.
    """
    # Check team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Authorization (same as get_team_snapshots)
    if current_user.role == "director":
        if not team.department_id:
            raise HTTPException(status_code=403, detail="Access denied")
        from app.models import Department
        department = db.query(Department).filter(Department.id == team.department_id).first()
        if not department or department.director_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role in ["member", "lead"]:
        if current_user.team_id != team_id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role not in ["admin", "executive"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    snapshots = services.get_team_snapshots(db, team_id, quarter, limit)
    
    trends = []
    for snapshot in snapshots:
        trends.append({
            "week": snapshot.week,
            "okr_score": float(snapshot.okr_objective_score) if snapshot.okr_objective_score else None,
            "bau_health": float(snapshot.bau_overall_health) if snapshot.bau_overall_health else None,
            "work_items_completion_rate": float(snapshot.work_items_completion_rate) if snapshot.work_items_completion_rate else None,
            "tasks_completion_rate": float(snapshot.tasks_completion_rate) if snapshot.tasks_completion_rate else None
        })
    
    return trends


@router.post("/create-all", response_model=List[schemas.WeeklySnapshotResponse])
def create_snapshots_for_all_teams(
    week: Optional[str] = Query(None, description="Week in ISO format. If not provided, uses current week."),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create snapshots for all teams.
    
    Only admins can create snapshots for all teams.
    This is typically called by a scheduled job on Fridays.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create snapshots for all teams")
    
    try:
        snapshots = services.create_snapshots_for_all_teams(db, week)
        return snapshots
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating snapshots: {str(e)}")

