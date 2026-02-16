"""BAU (Business As Usual) management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
from app.core.database import get_db
from app.models import BAUActivity, BAUMetric, Team, Department
from app.modules.bau.schemas import *
from app.modules.bau.services import (
    get_bau_activity_with_scores,
    get_team_bau_health,
    validate_metric_weights,
    update_metric_current_value
)
from app.api.v1.deps import get_current_user, get_current_team_lead
from app.modules.users.models import User


router = APIRouter(prefix="/api", tags=["bau"])


@router.post("/teams/{team_id}/bau", response_model=BAUActivityResponse, status_code=status.HTTP_201_CREATED)
def create_bau_activity(
    team_id: int,
    bau_data: BAUActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Create a new BAU activity for a team."""
    # Check team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    new_bau = BAUActivity(
        team_id=team_id,
        name=bau_data.name,
        description=bau_data.description
    )
    
    db.add(new_bau)
    db.commit()
    db.refresh(new_bau)
    
    return new_bau


@router.get("/teams/{team_id}/bau", response_model=List[BAUActivityResponse])
def list_team_bau_activities(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all BAU activities for a team."""
    # Check team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Authorization: Directors can only see BAU for teams in their department
    if current_user.role == "director":
        if not team.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: This team does not belong to your department"
            )
        department = db.query(Department).filter(Department.id == team.department_id).first()
        if not department or department.director_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: This team does not belong to your department"
            )

    activities = db.query(BAUActivity).filter(
        BAUActivity.team_id == team_id
    ).all()
    
    return activities


@router.get("/bau/{bau_id}", response_model=BAUActivityDetailResponse)
def get_bau_activity(
    bau_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get BAU activity details with metrics."""
    activity = db.query(BAUActivity).filter(BAUActivity.id == bau_id).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BAU activity not found"
        )
    
    # Authorization: Directors can only see BAU for teams in their department
    if current_user.role == "director":
        team = db.query(Team).filter(Team.id == activity.team_id).first()
        if not team or not team.department_id:
            raise HTTPException(status_code=403, detail="Access denied")
        department = db.query(Department).filter(Department.id == team.department_id).first()
        if not department or department.director_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return activity


@router.get("/bau/{bau_id}/with-scores", response_model=BAUActivityWithScore)
def get_bau_activity_with_calculated_scores(
    bau_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get BAU activity with calculated achievement and scores."""
    # Authorization: Directors can only see BAU for teams in their department
    if current_user.role == "director":
        activity = db.query(BAUActivity).filter(BAUActivity.id == bau_id).first()
        if not activity:
            raise HTTPException(status_code=404, detail="BAU activity not found")
        team = db.query(Team).filter(Team.id == activity.team_id).first()
        if not team or not team.department_id:
            raise HTTPException(status_code=403, detail="Access denied")
        department = db.query(Department).filter(Department.id == team.department_id).first()
        if not department or department.director_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

    activity_data = get_bau_activity_with_scores(db, bau_id)
    
    if not activity_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BAU activity not found"
        )
    
    return activity_data


@router.put("/bau/{bau_id}", response_model=BAUActivityResponse)
def update_bau_activity(
    bau_id: int,
    bau_data: BAUActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Update a BAU activity."""
    activity = db.query(BAUActivity).filter(BAUActivity.id == bau_id).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BAU activity not found"
        )
    
    if bau_data.name is not None:
        activity.name = bau_data.name
    
    if bau_data.description is not None:
        activity.description = bau_data.description
    
    if bau_data.is_active is not None:
        activity.is_active = bau_data.is_active
    
    db.commit()
    db.refresh(activity)
    
    return activity


@router.delete("/bau/{bau_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bau_activity(
    bau_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Delete a BAU activity."""
    activity = db.query(BAUActivity).filter(BAUActivity.id == bau_id).first()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BAU activity not found"
        )

    db.delete(activity)
    db.commit()


@router.post("/bau/{bau_id}/metrics", response_model=BAUMetricResponse, status_code=status.HTTP_201_CREATED)
def create_bau_metric(
    bau_id: int,
    metric_data: BAUMetricCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Add a metric (KPI) to a BAU activity."""
    activity = db.query(BAUActivity).filter(BAUActivity.id == bau_id).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BAU activity not found"
        )
    
    # Note: Weight validation is relaxed to allow incremental additions
    # Users can add/edit metrics and adjust weights as needed
    # Weights should ideally sum to 1.0, but this is not strictly enforced during creation
    
    new_metric = BAUMetric(
        bau_activity_id=bau_id,
        name=metric_data.name,
        target_value=metric_data.target_value,
        current_value=metric_data.current_value,
        unit=metric_data.unit,
        weight=metric_data.weight,
        metric_type=metric_data.metric_type
    )
    
    db.add(new_metric)
    db.commit()
    db.refresh(new_metric)
    
    return new_metric


@router.get("/bau/{bau_id}/metrics", response_model=List[BAUMetricResponse])
def list_bau_metrics(
    bau_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all metrics for a BAU activity."""
    activity = db.query(BAUActivity).filter(BAUActivity.id == bau_id).first()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BAU activity not found"
        )

    metrics = db.query(BAUMetric).filter(
        BAUMetric.bau_activity_id == bau_id
    ).all()

    return metrics


@router.get("/bau-metrics/{metric_id}", response_model=BAUMetricResponse)
def get_bau_metric(
    metric_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific BAU metric."""
    metric = db.query(BAUMetric).filter(BAUMetric.id == metric_id).first()

    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BAU metric not found"
        )

    return metric


@router.patch("/bau-metrics/{metric_id}", response_model=BAUMetricResponse)
def update_bau_metric(
    metric_id: int,
    metric_data: BAUMetricUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Update a BAU metric properties."""
    metric = db.query(BAUMetric).filter(BAUMetric.id == metric_id).first()
    
    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metric not found"
        )
    
    # Note: Weight validation is relaxed to allow flexible adjustments
    # Users can update weights incrementally without strict enforcement
    
    if metric_data.name is not None:
        metric.name = metric_data.name
    
    if metric_data.target_value is not None:
        metric.target_value = metric_data.target_value
    
    if metric_data.unit is not None:
        metric.unit = metric_data.unit
    
    if metric_data.weight is not None:
        metric.weight = metric_data.weight
    
    if metric_data.metric_type is not None:
        metric.metric_type = metric_data.metric_type
    
    if metric_data.current_value is not None:
        metric.current_value = metric_data.current_value
    
    db.commit()
    db.refresh(metric)
    
    return metric


@router.patch("/bau-metrics/{metric_id}/current-value")
def update_metric_current(
    metric_id: int,
    current_value: Decimal,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Update only the current value of a BAU Metric (weekly update by Manager)."""
    metric = update_metric_current_value(db, metric_id, current_value)
    
    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metric not found"
        )
    
    return {
        "id": metric.id,
        "current_value": metric.current_value,
        "message": "Current value updated successfully"
    }


@router.delete("/bau-metrics/{metric_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bau_metric(
    metric_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Delete a BAU metric."""
    metric = db.query(BAUMetric).filter(BAUMetric.id == metric_id).first()

    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BAU metric not found"
        )

    # Validate remaining weights will be valid
    activity_id = metric.bau_activity_id
    db.delete(metric)
    db.flush()  # Apply delete but don't commit yet
    
    is_valid, error_msg = validate_metric_weights(db, activity_id)
    if not is_valid and error_msg:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete: {error_msg}"
        )
    
    db.commit()


@router.get("/teams/{team_id}/bau/health", response_model=BAUOverallHealthResponse)
def get_team_bau_overall_health(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get overall BAU health for a team with all activities and scores."""
    # Check team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Authorization: Directors can only see BAU for teams in their department
    if current_user.role == "director":
        if not team.department_id:
            raise HTTPException(status_code=403, detail="Access denied")
        department = db.query(Department).filter(Department.id == team.department_id).first()
        if not department or department.director_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
            
    health_data = get_team_bau_health(db, team_id)
    
    return health_data
