"""BAU service logic."""

from sqlalchemy.orm import Session
from app.models import BAUActivity, BAUMetric, WorkItem


def calculate_bau_health(db: Session, bau_activity_id: int) -> float:
    """Calculate BAU health score from weighted metrics."""
    metrics = db.query(BAUMetric).filter(
        BAUMetric.bau_activity_id == bau_activity_id
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


def calculate_bau_execution(db: Session, bau_id: int) -> float:
    """
    Calculate BAU team effort Operational Control Execution(OCE) as the percentage of completed tasks
    across all work items linked to the BAU activity.
    """
    work_items = db.query(WorkItem).filter(
        WorkItem.source_type == "BAU",
        WorkItem.source_id == bau_id
    ).all()

    if not work_items:
        return 0.0

    total_tasks = 0
    completed_tasks = 0
    for wi in work_items:
        total_tasks += len(wi.tasks)
        completed_tasks += sum(1 for t in wi.tasks if t.status == "Done")

    return (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0.0

