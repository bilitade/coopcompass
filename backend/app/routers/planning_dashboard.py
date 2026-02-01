"""Weekly planning and dashboard endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.utils.dependencies import get_current_user, get_current_team_lead
from app.calculations import (
    get_team_dashboard, 
    get_department_dashboard,
    get_organization_dashboard,
    calculate_okr_progress, 
    calculate_bau_health, 
    calculate_work_item_progress, 
    get_current_week
)
from datetime import datetime

router = APIRouter(prefix="/api", tags=["planning", "dashboard"])


@router.post("/weekly-priorities", response_model=schemas.WeeklyPriorityResponse, status_code=status.HTTP_201_CREATED)
def set_weekly_priority(
    priority_data: schemas.WeeklyPriorityCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_team_lead)
):
    """Set or update a work item priority for a week."""
    # Check work item exists
    work_item = db.query(models.WorkItem).filter(models.WorkItem.id == priority_data.work_item_id).first()
    if not work_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work item not found"
        )
    
    # Check if priority already exists for this week
    existing = db.query(models.WeeklyPriority).filter(
        models.WeeklyPriority.work_item_id == priority_data.work_item_id,
        models.WeeklyPriority.week == priority_data.week
    ).first()
    
    if existing:
        # Update existing
        existing.priority = priority_data.priority
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new
        new_priority = models.WeeklyPriority(
            work_item_id=priority_data.work_item_id,
            week=priority_data.week,
            priority=priority_data.priority
        )
        db.add(new_priority)
        db.commit()
        db.refresh(new_priority)
        return new_priority


@router.get("/weekly-priorities", response_model=list[schemas.WeeklyPriorityResponse])
def list_weekly_priorities(
    week: str = Query(None),
    team_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List weekly priorities with optional filters."""
    query = db.query(models.WeeklyPriority)
    
    if week:
        query = query.filter(models.WeeklyPriority.week == week)
    
    if team_id:
        query = query.join(models.WorkItem).filter(models.WorkItem.team_id == team_id)
    
    priorities = query.all()
    return priorities


@router.put("/weekly-priorities/{priority_id}", response_model=schemas.WeeklyPriorityResponse)
def update_weekly_priority(
    priority_id: int,
    priority_data: schemas.WeeklyPriorityUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_team_lead)
):
    """Update a weekly priority."""
    priority = db.query(models.WeeklyPriority).filter(models.WeeklyPriority.id == priority_id).first()
    
    if not priority:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Priority not found"
        )
    
    priority.priority = priority_data.priority
    db.commit()
    db.refresh(priority)
    
    return priority


@router.delete("/weekly-priorities/{priority_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_weekly_priority(
    priority_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_team_lead)
):
    """Delete a weekly priority."""
    priority = db.query(models.WeeklyPriority).filter(models.WeeklyPriority.id == priority_id).first()
    
    if not priority:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Priority not found"
        )
    
    db.delete(priority)
    db.commit()


@router.get("/teams/{team_id}/dashboard", response_model=schemas.DashboardResponse)
def get_dashboard(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get team dashboard with all performance metrics."""
    # Check team exists
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    dashboard_data = get_team_dashboard(db, team_id)
    
    return schemas.DashboardResponse(
        team_id=team_id,
        okr_progress=dashboard_data["okr_progress"],
        bau_health=dashboard_data["bau_health"],
        bau_execution=dashboard_data.get("bau_execution", 0.0),
        okrs=dashboard_data["okrs"],
        bau_activities=dashboard_data["bau_activities"],
        current_week_priorities=dashboard_data["current_week_priorities"],
        updated_at=dashboard_data["updated_at"]
    )


@router.get("/teams/{team_id}/performance", response_model=list[schemas.PerformanceTrendResponse])
def get_performance_trend(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get performance trend over time.
    
    Note: This is a simplified version that returns snapshot data.
    In a production system, you'd want to store historical snapshots.
    """
    # Check team exists
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Get current snapshot
    current_data = get_team_dashboard(db, team_id)
    
    # Return a single data point (in production, would return historical data)
    return [
        {
            "date": datetime.utcnow().isoformat(),
            "okr_progress": current_data["okr_progress"],
            "bau_health": current_data["bau_health"]
        }
    ]


@router.get("/departments/{department_id}/dashboard", response_model=schemas.DepartmentDashboardResponse)
def get_department_dashboard_endpoint(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get department dashboard with all teams performance metrics."""
    # Check department exists
    department = db.query(models.Department).filter(models.Department.id == department_id).first()
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    
    dashboard_data = get_department_dashboard(db, department_id)
    
    return schemas.DepartmentDashboardResponse(
        department_id=dashboard_data["department_id"],
        total_teams=dashboard_data["total_teams"],
        total_members=dashboard_data["total_members"],
        average_okr_progress=dashboard_data["average_okr_progress"],
        average_bau_health=dashboard_data["average_bau_health"],
        teams=[
            schemas.TeamDashboardSummaryResponse(
                team_id=t["team_id"],
                team_name=t["team_name"],
                members_count=t["members_count"],
                okr_progress=t["okr_progress"],
                bau_health=t["bau_health"]
            ) for t in dashboard_data["teams"]
        ],
        updated_at=dashboard_data["updated_at"]
    )


@router.get("/organization/dashboard", response_model=schemas.OrganizationDashboardResponse)
def get_organization_dashboard_endpoint(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get organization (executive) dashboard with all departments and teams."""
    # Check if user is executive or admin
    if current_user.role not in ['executive', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only executives can access organization dashboard"
        )
    
    dashboard_data = get_organization_dashboard(db)
    
    return schemas.OrganizationDashboardResponse(
        total_departments=dashboard_data["total_departments"],
        total_teams=dashboard_data["total_teams"],
        total_members=dashboard_data["total_members"],
        total_directors=dashboard_data["total_directors"],
        average_okr_progress=dashboard_data["average_okr_progress"],
        average_bau_health=dashboard_data["average_bau_health"],
        departments=[
            schemas.DepartmentSummaryResponse(
                department_id=d["department_id"],
                department_name=d["department_name"],
                director_name=d["director_name"],
                teams_count=d["teams_count"],
                members_count=d["members_count"],
                okr_progress=d["okr_progress"],
                bau_health=d["bau_health"]
            ) for d in dashboard_data["departments"]
        ],
        updated_at=dashboard_data["updated_at"]
    )

