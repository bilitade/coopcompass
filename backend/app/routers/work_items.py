"""Work items and tasks endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app import models, schemas
from app.utils.dependencies import get_current_user, get_current_team_lead
from app.calculations import calculate_work_item_progress
from datetime import datetime

router = APIRouter(prefix="/api", tags=["work-items", "tasks"])


@router.post("/work-items", response_model=schemas.WorkItemResponse, status_code=status.HTTP_201_CREATED)
def create_work_item(
    work_item_data: schemas.WorkItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_team_lead)
):
    """Create a new work item."""
    # Verify source exists (OKR or BAU)
    if work_item_data.source_type == "OKR":
        source = db.query(models.KeyResult).filter(models.KeyResult.id == work_item_data.source_id).first()
    else:  # BAU
        source = db.query(models.BAUActivity).filter(models.BAUActivity.id == work_item_data.source_id).first()
    
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{work_item_data.source_type} source not found"
        )
    
    new_work_item = models.WorkItem(
        team_id=work_item_data.team_id if hasattr(work_item_data, 'team_id') else current_user.team_id,
        name=work_item_data.name,
        description=work_item_data.description,
        source_type=work_item_data.source_type,
        source_id=work_item_data.source_id,
        owner_id=work_item_data.owner_id,
        month=work_item_data.month
    )
    
    db.add(new_work_item)
    db.commit()
    db.refresh(new_work_item)
    
    return new_work_item


@router.get("/work-items", response_model=list[schemas.WorkItemResponse])
def list_work_items(
    team_id: int = Query(None),
    month: str = Query(None),
    source_type: str = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List work items with optional filters."""
    query = db.query(models.WorkItem)
    
    if team_id:
        query = query.filter(models.WorkItem.team_id == team_id)
    
    if month:
        query = query.filter(models.WorkItem.month == month)
    
    if source_type:
        query = query.filter(models.WorkItem.source_type == source_type)
    
    work_items = query.all()
    return work_items


@router.get("/work-items-with-source", response_model=list[schemas.WorkItemWithSourceResponse])
def list_work_items_with_source(
    team_id: int = Query(None),
    month: str = Query(None),
    source_type: str = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List work items with related OKR Key Results or BAU Activities data."""
    query = db.query(models.WorkItem)
    
    if team_id:
        query = query.filter(models.WorkItem.team_id == team_id)
    
    if month:
        query = query.filter(models.WorkItem.month == month)
    
    if source_type:
        query = query.filter(models.WorkItem.source_type == source_type)
    
    work_items = query.all()
    
    # Manually load related source data
    result = []
    for wi in work_items:
        wi_dict = {
            'id': wi.id,
            'team_id': wi.team_id,
            'name': wi.name,
            'description': wi.description,
            'source_type': wi.source_type,
            'source_id': wi.source_id,
            'owner_id': wi.owner_id,
            'month': wi.month,
            'created_at': wi.created_at,
            'updated_at': wi.updated_at,
            'key_result': None,
            'bau_activity': None,
        }
        
        # Load the related source
        if wi.source_type == 'OKR':
            kr = db.query(models.KeyResult).filter(models.KeyResult.id == wi.source_id).first()
            if kr:
                wi_dict['key_result'] = {
                    'id': kr.id,
                    'okr_id': kr.okr_id,
                    'description': kr.description,
                    'target_value': kr.target_value,
                    'current_value': kr.current_value,
                    'unit': kr.unit,
                    'created_at': kr.created_at,
                    'updated_at': kr.updated_at,
                }
        else:  # BAU
            bau = db.query(models.BAUActivity).filter(models.BAUActivity.id == wi.source_id).first()
            if bau:
                wi_dict['bau_activity'] = {
                    'id': bau.id,
                    'team_id': bau.team_id,
                    'name': bau.name,
                    'description': bau.description,
                    'is_active': bau.is_active,
                    'created_at': bau.created_at,
                    'updated_at': bau.updated_at,
                }
        
        result.append(wi_dict)
    
    return result


@router.get("/work-items/{work_item_id}", response_model=schemas.WorkItemDetailResponse)
def get_work_item(
    work_item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get work item details with tasks."""
    work_item = db.query(models.WorkItem).filter(models.WorkItem.id == work_item_id).first()
    
    if not work_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work item not found"
        )
    
    return work_item


@router.put("/work-items/{work_item_id}", response_model=schemas.WorkItemResponse)
def update_work_item(
    work_item_id: int,
    work_item_data: schemas.WorkItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_team_lead)
):
    """Update a work item."""
    work_item = db.query(models.WorkItem).filter(models.WorkItem.id == work_item_id).first()
    
    if not work_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work item not found"
        )
    
    if work_item_data.name is not None:
        work_item.name = work_item_data.name
    
    if work_item_data.description is not None:
        work_item.description = work_item_data.description
    
    if work_item_data.owner_id is not None:
        work_item.owner_id = work_item_data.owner_id
    
    db.commit()
    db.refresh(work_item)
    
    return work_item


@router.post("/work-items/{work_item_id}/tasks", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    work_item_id: int,
    task_data: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_team_lead)
):
    """Create a task for a work item."""
    work_item = db.query(models.WorkItem).filter(models.WorkItem.id == work_item_id).first()
    
    if not work_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work item not found"
        )
    
    new_task = models.Task(
        work_item_id=work_item_id,
        description=task_data.description,
        assignee_id=task_data.assignee_id,
        effort_hours=task_data.effort_hours
    )
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    return new_task


@router.get("/tasks/{task_id}", response_model=schemas.TaskDetailResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get task details."""
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return task


@router.patch("/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: int,
    task_data: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update a task."""
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    
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


@router.get("/users/{user_id}/tasks", response_model=list[schemas.TaskResponse])
def get_user_tasks(
    user_id: int,
    status: str = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all tasks assigned to a user."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    query = db.query(models.Task).filter(models.Task.assignee_id == user_id)
    
    if status:
        query = query.filter(models.Task.status == status)
    
    tasks = query.all()
    return tasks

