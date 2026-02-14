"""Weekly priority and dashboard endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import *
from app.schemas import *
from app.modules.weekly_priority.schemas import (
    WeeklyPriorityResponse, WeeklyPriorityCreate, WeeklyPriorityUpdate,
    DashboardResponse, PerformanceTrendResponse,
    DepartmentDashboardResponse, OrganizationDashboardResponse,
    TeamDashboardSummaryResponse, DepartmentSummaryResponse
)
from app.api.v1.deps import get_current_user, get_current_team_lead
from app.modules.weekly_priority.services import (
    get_team_dashboard, 
    get_department_dashboard,
    get_organization_dashboard,
)
from app.modules.bau.services import calculate_bau_health
from app.modules.work_items.services import calculate_work_item_progress
from app.services.calculations import get_current_week
from datetime import datetime

router = APIRouter(prefix="/api", tags=["weekly-priority", "dashboard"])


@router.post("/weekly-priorities", response_model=WeeklyPriorityResponse, status_code=status.HTTP_201_CREATED)
def set_weekly_priority(
    priority_data: WeeklyPriorityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Set or update a work item priority for a week."""
    # Check work item exists
    work_item = db.query(WorkItem).filter(WorkItem.id == priority_data.work_item_id).first()
    if not work_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work item not found"
        )
    
    # Check if priority already exists for this week
    existing = db.query(WeeklyPriority).filter(
        WeeklyPriority.work_item_id == priority_data.work_item_id,
        WeeklyPriority.week == priority_data.week
    ).first()
    
    if existing:
        # Update existing
        existing.priority = priority_data.priority
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new
        new_priority = WeeklyPriority(
            work_item_id=priority_data.work_item_id,
            week=priority_data.week,
            priority=priority_data.priority
        )
        db.add(new_priority)
        db.commit()
        db.refresh(new_priority)
        return new_priority


@router.get("/weekly-priorities", response_model=list[WeeklyPriorityResponse])
def list_weekly_priorities(
    week: str = Query(None),
    team_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List weekly priorities with optional filters."""
    query = db.query(WeeklyPriority)
    
    if week:
        query = query.filter(WeeklyPriority.week == week)
    
    if team_id:
        query = query.join(WorkItem).filter(WorkItem.team_id == team_id)
    
    priorities = query.all()
    return priorities


@router.put("/weekly-priorities/{priority_id}", response_model=WeeklyPriorityResponse)
def update_weekly_priority(
    priority_id: int,
    priority_data: WeeklyPriorityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Update a weekly priority."""
    priority = db.query(WeeklyPriority).filter(WeeklyPriority.id == priority_id).first()
    
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
    current_user: User = Depends(get_current_team_lead)
):
    """Delete a weekly priority."""
    priority = db.query(WeeklyPriority).filter(WeeklyPriority.id == priority_id).first()
    
    if not priority:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Priority not found"
        )
    
    db.delete(priority)
    db.commit()


@router.get("/teams/{team_id}/dashboard", response_model=DashboardResponse)
def get_dashboard(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get team dashboard with all performance metrics."""
    # Check team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    dashboard_data = get_team_dashboard(db, team_id)
    
    return DashboardResponse(
        team_id=team_id,
        okr_progress=dashboard_data["okr_progress"],
        bau_health=dashboard_data["bau_health"],
        okrs=dashboard_data["okrs"],
        bau_activities=dashboard_data["bau_activities"],
        current_week_priorities=dashboard_data["current_week_priorities"],
        updated_at=dashboard_data["updated_at"]
    )


@router.get("/teams/{team_id}/performance", response_model=list[PerformanceTrendResponse])
def get_performance_trend(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get performance trend over time.
    
    Note: This is a simplified version that returns snapshot data.
    In a production system, you'd want to store historical snapshots.
    """
    # Check team exists
    team = db.query(Team).filter(Team.id == team_id).first()
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


@router.get("/departments/{department_id}/dashboard", response_model=DepartmentDashboardResponse)
def get_department_dashboard_endpoint(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get department dashboard with all teams performance metrics."""
    # Check department exists
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    
    dashboard_data = get_department_dashboard(db, department_id)
    
    return DepartmentDashboardResponse(
        department_id=dashboard_data["department_id"],
        total_teams=dashboard_data["total_teams"],
        total_members=dashboard_data["total_members"],
        average_okr_progress=dashboard_data["average_okr_progress"],
        average_bau_health=dashboard_data["average_bau_health"],
        teams=[
            TeamDashboardSummaryResponse(
                team_id=t["team_id"],
                team_name=t["team_name"],
                members_count=t["members_count"],
                okr_progress=t["okr_progress"],
                bau_health=t["bau_health"]
            ) for t in dashboard_data["teams"]
        ],
        updated_at=dashboard_data["updated_at"]
    )


@router.get("/organization/dashboard", response_model=OrganizationDashboardResponse)
def get_organization_dashboard_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get organization (executive) dashboard with all departments and teams."""
    # Check if user is executive or admin
    if current_user.role not in ['executive', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only executives can access organization dashboard"
        )
    
    dashboard_data = get_organization_dashboard(db)
    
    return OrganizationDashboardResponse(
        total_departments=dashboard_data["total_departments"],
        total_teams=dashboard_data["total_teams"],
        total_members=dashboard_data["total_members"],
        total_directors=dashboard_data["total_directors"],
        average_okr_progress=dashboard_data["average_okr_progress"],
        average_bau_health=dashboard_data["average_bau_health"],
        departments=[
            DepartmentSummaryResponse(
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

