"""Tasks endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from datetime import datetime

from app.core.database import get_db
from app.api.v1.deps import get_current_user, get_current_team_lead
from app.modules.users.models import User
from app.modules.tasks.models import Task
from app.modules.tasks.schemas import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskDetailResponse,
    TaskWithWorkItemResponse
)
# We need WorkItem model to check existence
from app.modules.work_items.models import WorkItem

router = APIRouter(prefix="/api", tags=["tasks"])


@router.post("/work-items/{work_item_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    work_item_id: int,
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Create a task for a work item."""
    work_item = db.query(WorkItem).filter(WorkItem.id == work_item_id).first()
    
    if not work_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work item not found"
        )
    
    new_task = Task(
        work_item_id=work_item_id,
        description=task_data.description,
        assignee_id=task_data.assignee_id,
        effort_hours=task_data.effort_hours
    )
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    return new_task


@router.get("/tasks/{task_id}", response_model=TaskDetailResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get task details."""
    task = db.query(Task).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return task


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    if task_data.description is not None:
        task.description = task_data.description
    
    if task_data.assignee_id is not None:
        task.assignee_id = task_data.assignee_id
    
    if task_data.status is not None:
        task.status = task_data.status
        
        # Set completed_at when task is marked Done
        if task_data.status == "Done":
            task.completed_at = datetime.utcnow()
        elif task.status == "Done" and task_data.status != "Done":
            # Reset completed_at if unmarking as done
            task.completed_at = None
    
    if task_data.effort_hours is not None:
        task.effort_hours = task_data.effort_hours
    
    if task_data.blocked_reason is not None:
        task.blocked_reason = task_data.blocked_reason
    
    db.commit()
    db.refresh(task)
    
    return task


@router.get("/users/{user_id}/tasks", response_model=list[TaskResponse])
def get_user_tasks(
    user_id: int,
    status: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all tasks assigned to a user."""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    query = db.query(Task).filter(Task.assignee_id == user_id)
    
    if status:
        query = query.filter(Task.status == status)
    
    tasks = query.all()
    return tasks


@router.get("/teams/{team_id}/tasks", response_model=list[TaskWithWorkItemResponse])
def get_team_tasks(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all tasks for a team (grouped by work items)."""
    # Verify user belongs to the team
    if current_user.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this team's tasks"
        )
    
    # Get all work items for the team
    work_items = db.query(WorkItem).filter(WorkItem.team_id == team_id).all()
    
    # Get all tasks for these work items with eager loading of work_item relationship
    task_ids = [wi.id for wi in work_items]
    if not task_ids:
        return []
        
    tasks = db.query(Task).filter(Task.work_item_id.in_(task_ids)).options(
        joinedload(Task.work_item)
    ).all()
    
    return tasks
