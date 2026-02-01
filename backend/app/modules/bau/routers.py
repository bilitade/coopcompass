"""BAU (Business As Usual) management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import *
from app.schemas import *
from app.api.v1.deps import get_current_user, get_current_team_lead
from app.modules.bau.services import calculate_bau_health, calculate_bau_execution


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


@router.get("/teams/{team_id}/bau", response_model=list[BAUActivityResponse])
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
    
    return activity


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

    # Check if user is from the same team
    if activity.team_id != current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this BAU activity"
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
    """Add a metric to a BAU activity."""
    activity = db.query(BAUActivity).filter(BAUActivity.id == bau_id).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BAU activity not found"
        )
    
    new_metric = BAUMetric(
        bau_activity_id=bau_id,
        name=metric_data.name,
        target_value=metric_data.target_value,
        unit=metric_data.unit,
        weight=metric_data.weight,
        is_higher_better=metric_data.is_higher_better
    )
    
    db.add(new_metric)
    db.commit()
    db.refresh(new_metric)
    
    return new_metric


@router.get("/bau/{bau_id}/metrics", response_model=list[BAUMetricResponse])
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

    # Check if user is from the same team
    if activity.team_id != current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this BAU activity"
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

    # Check if user is from the same team as the activity
    activity = db.query(BAUActivity).filter(
        BAUActivity.id == metric.bau_activity_id
    ).first()

    if activity.team_id != current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this BAU metric"
        )

    return metric


@router.patch("/bau-metrics/{metric_id}", response_model=BAUMetricResponse)
def update_bau_metric(
    metric_id: int,
    metric_data: BAUMetricUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Update a BAU metric value and other properties."""
    metric = db.query(BAUMetric).filter(BAUMetric.id == metric_id).first()
    
    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metric not found"
        )
    
    if metric_data.name is not None:
        metric.name = metric_data.name
    
    if metric_data.target_value is not None:
        metric.target_value = metric_data.target_value
    
    if metric_data.unit is not None:
        metric.unit = metric_data.unit
    
    if metric_data.weight is not None:
        metric.weight = metric_data.weight
    
    if metric_data.is_higher_better is not None:
        metric.is_higher_better = metric_data.is_higher_better
    
    if metric_data.current_value is not None:
        metric.current_value = metric_data.current_value
        
        # Record metric history
        history_entry = MetricHistory(
            bau_metric_id=metric_id,
            value=metric_data.current_value
        )
        db.add(history_entry)
    
    db.commit()
    db.refresh(metric)
    
    return metric


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

    # Check if user is from the same team as the activity
    activity = db.query(BAUActivity).filter(
        BAUActivity.id == metric.bau_activity_id
    ).first()

    if activity.team_id != current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this BAU metric"
        )

    db.delete(metric)
    db.commit()


@router.get("/bau/{bau_id}/health", response_model=BAUHealthResponse)
def get_bau_health(
    bau_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get BAU activity health score."""
    activity = db.query(BAUActivity).filter(BAUActivity.id == bau_id).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BAU activity not found"
        )
    
    health = calculate_bau_health(db, bau_id)
    
    metrics_data = [
        {
            "id": m.id,
            "bau_activity_id": m.bau_activity_id,
            "name": m.name,
            "target_value": m.target_value,
            "current_value": m.current_value,
            "unit": m.unit,
            "weight": m.weight,
            "is_higher_better": m.is_higher_better,
            "created_at": m.created_at,
            "updated_at": m.updated_at
        }
        for m in activity.metrics
    ]
    
    return {
        "activity_id": activity.id,
        "activity_name": activity.name,
        "health": health,
        "metrics": metrics_data
    }


@router.get("/bau-metrics/{metric_id}/history", response_model=list[MetricHistoryResponse])
def get_metric_history(
    metric_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get metric history."""
    metric = db.query(BAUMetric).filter(BAUMetric.id == metric_id).first()
    
    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metric not found"
        )
    
    history = db.query(MetricHistory).filter(
        MetricHistory.bau_metric_id == metric_id
    ).order_by(MetricHistory.recorded_at.desc()).all()
    
    return history

@router.get("/bau/{bau_id}/execution", response_model=float)
def get_bau_execution(
    bau_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get BAU team effort (Operational Control Execution, OCE) for a BAU activity.
    Returns a percentage (0-100).
    """
    activity = db.query(BAUActivity).filter(BAUActivity.id == bau_id).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BAU activity not found"
        )

    # Ensure user is in the same team
    if activity.team_id != current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this BAU activity"
        )

    execution = calculate_bau_execution(db, bau_id)
    return execution