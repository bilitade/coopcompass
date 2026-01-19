"""Calculation logic for progress and health metrics."""

from sqlalchemy.orm import Session
from decimal import Decimal
from app import models
from datetime import datetime, date


def calculate_work_item_progress(db: Session, work_item_id: int) -> float:
    """Calculate work item progress based on task completion percentage."""
    tasks = db.query(models.Task).filter(
        models.Task.work_item_id == work_item_id
    ).all()
    
    if not tasks:
        return 0.0
    
    done_count = sum(1 for task in tasks if task.status == "Done")
    progress = (done_count / len(tasks)) * 100
    
    return round(progress, 2)


def calculate_kr_progress(db: Session, kr_id: int) -> float:
    """Calculate Key Result progress from related work items."""
    work_items = db.query(models.WorkItem).filter(
        models.WorkItem.source_type == "OKR",
        models.WorkItem.source_id == kr_id
    ).all()
    
    if not work_items:
        return 0.0
    
    total_progress = sum(
        calculate_work_item_progress(db, wi.id) for wi in work_items
    )
    
    avg_progress = total_progress / len(work_items)
    
    # Update KR current_value based on progress
    kr = db.query(models.KeyResult).filter(models.KeyResult.id == kr_id).first()
    if kr and kr.target_value:
        kr.current_value = Decimal(str((avg_progress / 100) * float(kr.target_value)))
        db.commit()
    
    return round(avg_progress, 2)


def calculate_okr_progress(db: Session, okr_id: int) -> float:
    """Calculate overall OKR progress from all key results."""
    key_results = db.query(models.KeyResult).filter(
        models.KeyResult.okr_id == okr_id
    ).all()
    
    if not key_results:
        return 0.0
    
    kr_progresses = [calculate_kr_progress(db, kr.id) for kr in key_results]
    avg_progress = sum(kr_progresses) / len(kr_progresses)
    
    return round(avg_progress, 2)


def calculate_bau_health(db: Session, bau_activity_id: int) -> float:
    """Calculate BAU health score from weighted metrics."""
    metrics = db.query(models.BAUMetric).filter(
        models.BAUMetric.bau_activity_id == bau_activity_id
    ).all()
    
    if not metrics:
        return 0.0
    
    weighted_health = 0.0
    total_weight = 0.0
    
    for metric in metrics:
        # Calculate achievement percentage
        if metric.current_value == 0:
            achievement = 0.0
        elif metric.is_higher_better:
            # For "higher is better" metrics
            achievement = min((float(metric.current_value) / float(metric.target_value)) * 100, 100.0)
        else:
            # For "lower is better" metrics (e.g., downtime, MTTR)
            achievement = min((float(metric.target_value) / float(metric.current_value)) * 100, 100.0)
        
        weighted_health += achievement * float(metric.weight)
        total_weight += float(metric.weight)
    
    if total_weight == 0:
        return 0.0
    
    return round(weighted_health / total_weight, 2)


def get_current_quarter() -> str:
    """Get current quarter in Q# YYYY format."""
    now = datetime.utcnow()
    quarter = (now.month - 1) // 3 + 1
    return f"Q{quarter} {now.year}"


def get_current_week() -> str:
    """Get current week in YYYY-W## format."""
    today = date.today()
    iso_calendar = today.isocalendar()
    return f"{iso_calendar[0]}-W{iso_calendar[1]:02d}"


def get_team_dashboard(db: Session, team_id: int) -> dict:
    """Get complete dashboard data for a team."""
    # Get current quarter OKR
    current_quarter = get_current_quarter()
    
    okr = db.query(models.OKR).filter(
        models.OKR.team_id == team_id,
        models.OKR.quarter == current_quarter,
        models.OKR.is_active == True
    ).first()
    
    okr_progress = calculate_okr_progress(db, okr.id) if okr else 0.0
    
    # Build OKR details
    okrs_data = []
    if okr:
        kr_data = []
        for kr in okr.key_results:
            kr_progress = calculate_kr_progress(db, kr.id)
            kr_data.append({
                "kr_id": kr.id,
                "description": kr.description,
                "progress": kr_progress,
                "current_value": float(kr.current_value) if kr.current_value else 0.0,
                "target_value": float(kr.target_value)
            })
        
        okrs_data.append({
            "okr_id": okr.id,
            "objective": okr.objective,
            "quarter": okr.quarter,
            "progress": okr_progress,
            "key_results": kr_data
        })
    
    # Get BAU activities
    bau_activities = db.query(models.BAUActivity).filter(
        models.BAUActivity.team_id == team_id,
        models.BAUActivity.is_active == True
    ).all()
    
    bau_healths = []
    for activity in bau_activities:
        health = calculate_bau_health(db, activity.id)
        metrics_data = [
            {
                "id": m.id,
                "bau_activity_id": m.bau_activity_id,
                "name": m.name,
                "target_value": float(m.target_value),
                "current_value": float(m.current_value) if m.current_value else 0.0,
                "unit": m.unit,
                "weight": float(m.weight),
                "is_higher_better": m.is_higher_better,
                "created_at": m.created_at,
                "updated_at": m.updated_at
            }
            for m in activity.metrics
        ]
        bau_healths.append({
            "activity_id": activity.id,
            "activity_name": activity.name,
            "health": health,
            "metrics": metrics_data
        })
    
    avg_bau_health = (
        sum(b["health"] for b in bau_healths) / len(bau_healths)
        if bau_healths else 0.0
    )
    
    # Get current week priorities
    current_week = get_current_week()
    
    priorities = db.query(models.WeeklyPriority).filter(
        models.WeeklyPriority.week == current_week
    ).join(models.WorkItem).filter(
        models.WorkItem.team_id == team_id
    ).all()
    
    current_priorities = []
    for p in priorities:
        progress = calculate_work_item_progress(db, p.work_item_id)
        current_priorities.append({
            "priority_id": p.id,
            "work_item_id": p.work_item_id,
            "work_item_name": p.work_item.name,
            "priority": p.priority,
            "progress": progress
        })
    
    return {
        "team_id": team_id,
        "okr_progress": okr_progress,
        "bau_health": round(avg_bau_health, 2),
        "okrs": okrs_data,
        "bau_activities": bau_healths,
        "current_week_priorities": current_priorities,
        "updated_at": datetime.utcnow()
    }

