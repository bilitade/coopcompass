"""Work Items service logic."""

from sqlalchemy.orm import Session
from app.models import WorkItem
from app.modules.tasks.models import Task


def calculate_work_item_progress(db: Session, work_item_id: int) -> float:
    """Calculate work item progress based on task completion percentage."""
    tasks = db.query(Task).filter(
        Task.work_item_id == work_item_id
    ).all()
    
    if not tasks:
        return 0.0
    
    done_count = sum(1 for task in tasks if task.status == "Done")
    progress = (done_count / len(tasks)) * 100
    
    return round(progress, 2)

