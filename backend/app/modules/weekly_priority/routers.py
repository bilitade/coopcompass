"""Weekly priority and dashboard endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.v1 import deps
from . import services, schemas
from app.modules.users.models import User
from app.models import WeeklyPriority, WeeklyPriorityPlan, WorkItem, Team, Department

router = APIRouter(prefix="/api", tags=["weekly-priority", "dashboard"])


# Weekly Priority Plan Endpoints

@router.get("/weekly-priority/headsup/{headsup_id}/plans", response_model=List[schemas.WeeklyPriorityPlanResponse])
def read_plans(
    headsup_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get all weekly plans for a monthly heads-up."""
    return db.query(WeeklyPriorityPlan).filter(WeeklyPriorityPlan.monthly_headsup_id == headsup_id).all()


@router.get("/weekly-priority/headsup/{headsup_id}/plans/{week}", response_model=schemas.WeeklyPriorityPlanResponse)
def read_plan_by_week(
    headsup_id: int,
    week: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get a weekly plan by headsup ID and week."""
    db_obj = services.get_weekly_priority_plan_by_week(db, headsup_id=headsup_id, week=week)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Weekly plan not found")
    return db_obj


@router.post("/weekly-priority/plans", response_model=schemas.WeeklyPriorityPlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(
    obj_in: schemas.WeeklyPriorityPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_team_lead)
):
    """Create a new weekly priority plan."""
    existing = services.get_weekly_priority_plan_by_week(db, headsup_id=obj_in.monthly_headsup_id, week=obj_in.week)
    if existing:
        raise HTTPException(status_code=400, detail=f"Weekly plan already exists for {obj_in.week}")
    return services.create_weekly_priority_plan(db, obj_in=obj_in)


@router.get("/weekly-priority/plans/{id}", response_model=schemas.WeeklyPriorityPlanResponse)
def read_plan(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get a weekly plan by ID."""
    db_obj = services.get_weekly_priority_plan(db, plan_id=id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Weekly plan not found")
    return db_obj


@router.put("/weekly-priority/plans/{id}", response_model=schemas.WeeklyPriorityPlanResponse)
def update_plan(
    id: int,
    obj_in: schemas.WeeklyPriorityPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_team_lead)
):
    """Update a weekly plan focus."""
    db_obj = services.get_weekly_priority_plan(db, plan_id=id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Weekly plan not found")
    return services.update_weekly_priority_plan(db, db_obj=db_obj, obj_in=obj_in)


# Weekly Priority Endpoints

@router.post("/weekly-priority/priorities", response_model=schemas.WeeklyPriorityResponse, status_code=status.HTTP_201_CREATED)
def set_weekly_priority(
    obj_in: schemas.WeeklyPriorityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_team_lead)
):
    """Add a work item to a weekly plan with a priority level."""
    # Check if priority already exists for this work item in this plan
    existing = db.query(WeeklyPriority).filter(
        WeeklyPriority.plan_id == obj_in.plan_id,
        WeeklyPriority.work_item_id == obj_in.work_item_id
    ).first()
    
    if existing:
        # Update existing
        try:
            return services.update_weekly_priority(db, priority_id=existing.id, new_priority=obj_in.priority)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    else:
        # Create new
        try:
            return services.create_weekly_priority(db, obj_in=obj_in)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))


@router.get("/weekly-priority/plans/{plan_id}/priorities", response_model=List[schemas.WeeklyPriorityResponse])
def list_weekly_priorities(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """List all priorities for a weekly plan."""
    return services.get_weekly_priorities(db, plan_id=plan_id)


@router.get("/weekly-priority/priorities", response_model=List[schemas.WeeklyPriorityResponse])
def list_weekly_priorities_alt(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Alternative list all priorities for a weekly plan."""
    return services.get_weekly_priorities(db, plan_id=plan_id)


@router.put("/weekly-priority/priorities/{priority_id}", response_model=schemas.WeeklyPriorityResponse)
def update_weekly_priority(
    priority_id: int,
    priority: int = Query(..., ge=1, le=3),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_team_lead)
):
    """Update a priority level."""
    try:
        updated = services.update_weekly_priority(db, priority_id=priority_id, new_priority=priority)
        if not updated:
            raise HTTPException(status_code=404, detail="Priority not found")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/weekly-priority/priorities/{priority_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_weekly_priority(
    priority_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_team_lead)
):
    """Delete a weekly priority."""
    if not services.delete_weekly_priority(db, priority_id=priority_id):
        raise HTTPException(status_code=404, detail="Priority not found")
    return None


# Dashboard Endpoints

@router.get("/teams/{team_id}/dashboard", response_model=schemas.DashboardResponse)
def get_dashboard(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get team dashboard with all performance metrics."""
    # Check team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    return services.get_team_dashboard(db, team_id)


@router.get("/teams/{team_id}/performance", response_model=List[schemas.PerformanceTrendResponse])
def get_performance_trend(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get performance trend over time."""
    from datetime import datetime, timezone
    
    # Check team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    dashboard_data = services.get_team_dashboard(db, team_id)
    
    return [
        {
            "date": datetime.now(timezone.utc).isoformat(),
            "okr_progress": dashboard_data["okr_progress"],
            "bau_health": dashboard_data["bau_health"]
        }
    ]


@router.get("/departments/{department_id}/dashboard", response_model=schemas.DepartmentDashboardResponse)
def get_department_dashboard_endpoint(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get department dashboard for director view."""
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    return services.get_department_dashboard(db, department_id)


@router.get("/organization/dashboard", response_model=schemas.OrganizationDashboardResponse)
def get_organization_dashboard_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get organization dashboard for executive view."""
    if current_user.role not in ['executive', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return services.get_organization_dashboard(db)
