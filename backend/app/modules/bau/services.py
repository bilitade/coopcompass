"""BAU service logic."""

from sqlalchemy.orm import Session
from typing import Dict, List
from decimal import Decimal
from app.models import BAUActivity, BAUMetric
from app.services.calculations import (
    calculate_bau_metric_achievement,
    calculate_bau_activity_score,
    calculate_bau_overall_health,
    get_bau_status,
    validate_weights_sum_to_one
)


def get_bau_activity_with_scores(db: Session, activity_id: int) -> Dict:
    """
    Get BAU Activity with calculated achievement and scores for all metrics.
    
    Args:
        db: Database session
        activity_id: BAU Activity ID
    
    Returns:
        Dictionary with activity data and calculated scores
    """
    activity = db.query(BAUActivity).filter(BAUActivity.id == activity_id).first()
    
    if not activity:
        return None
    
    # Calculate achievement for each metric
    metric_data = []
    for metric in activity.metrics:
        achievement = calculate_bau_metric_achievement(
            metric.target_value,
            metric.current_value,
            metric.metric_type
        )
        metric_data.append({
            'id': metric.id,
            'bau_activity_id': metric.bau_activity_id,
            'name': metric.name,
            'target_value': metric.target_value,
            'current_value': metric.current_value,
            'unit': metric.unit,
            'weight': metric.weight,
            'metric_type': metric.metric_type,
            'created_at': metric.created_at,
            'updated_at': metric.updated_at,
            'achievement': achievement
        })
    
    # Calculate activity score
    activity_score = calculate_bau_activity_score([
        {'achievement': m['achievement'], 'weight': m['weight']}
        for m in metric_data
    ])
    
    return {
        'id': activity.id,
        'team_id': activity.team_id,
        'name': activity.name,
        'description': activity.description,
        'is_active': activity.is_active,
        'created_at': activity.created_at,
        'updated_at': activity.updated_at,
        'metrics': metric_data,
        'activity_score': activity_score
    }


def get_team_bau_health(db: Session, team_id: int) -> Dict:
    """
    Get overall BAU health for a team.
    
    Args:
        db: Database session
        team_id: Team ID
    
    Returns:
        Dictionary with overall BAU health data
    """
    activities = db.query(BAUActivity).filter(
        BAUActivity.team_id == team_id,
        BAUActivity.is_active == True
    ).all()
    
    if not activities:
        return {
            'team_id': team_id,
            'activities': [],
            'overall_health': 0.0,
            'status': 'Poor'
        }
    
    # Get scores for all activities
    activity_data = []
    for activity in activities:
        activity_with_scores = get_bau_activity_with_scores(db, activity.id)
        if activity_with_scores:
            activity_data.append({
                'score': activity_with_scores['activity_score']
            })
    
    # Calculate overall health
    overall_health = calculate_bau_overall_health(activity_data)
    status = get_bau_status(overall_health)
    
    # Get full activity details
    full_activities = [
        get_bau_activity_with_scores(db, activity.id)
        for activity in activities
    ]
    
    return {
        'team_id': team_id,
        'activities': full_activities,
        'overall_health': overall_health,
        'status': status
    }


def validate_metric_weights(db: Session, activity_id: int, exclude_metric_id: int = None) -> tuple[bool, str]:
    """
    Validate that all metric weights for a BAU Activity sum to 1.0.
    
    Args:
        db: Database session
        activity_id: BAU Activity ID
        exclude_metric_id: Optional Metric ID to exclude (for updates/deletes)
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    query = db.query(BAUMetric).filter(BAUMetric.bau_activity_id == activity_id)
    
    if exclude_metric_id:
        query = query.filter(BAUMetric.id != exclude_metric_id)
    
    metrics = query.all()
    
    if not metrics:
        return True, ""  # No metrics yet
    
    weights = [m.weight for m in metrics]
    
    if not validate_weights_sum_to_one(weights):
        total = sum(float(w) for w in weights)
        return False, f"Metric weights must sum to 1.0 (currently {total:.3f})"
    
    return True, ""


def update_metric_current_value(db: Session, metric_id: int, new_value: Decimal) -> BAUMetric:
    """
    Update a BAU Metric's current value (typically done weekly by Manager).
    
    Args:
        db: Database session
        metric_id: Metric ID
        new_value: New current value
    
    Returns:
        Updated BAUMetric
    """
    metric = db.query(BAUMetric).filter(BAUMetric.id == metric_id).first()
    
    if not metric:
        return None
    
    metric.current_value = new_value
    db.commit()
    db.refresh(metric)
    
    return metric
