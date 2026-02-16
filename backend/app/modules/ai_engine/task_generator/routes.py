"""Task Generator API routes."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.api.v1.deps import get_current_team_lead
from app.modules.users.models import User
from app.modules.ai_engine.task_generator.services.runner import run_task_generator
from app.modules.ai_engine.task_generator.schemas.state import TaskGenerationOutput
from app.modules.tasks.schemas import TaskCreate
from app.modules.tasks.models import Task
from app.modules.weekly_priority.models import WeeklyPriorityPlan
from app.core.logging_config import logger

router = APIRouter(prefix="/task-generator", tags=["task-generator"])


@router.post("/generate", response_model=TaskGenerationOutput)
def generate_tasks(
    weekly_plan_id: int,
    focus_priority: Optional[int] = Query(None, ge=1, le=3, description="Focus on specific priority (1, 2, or 3)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Generate tasks for a weekly plan using AI."""
    # Verify plan exists and user has access
    plan = db.query(WeeklyPriorityPlan).filter(WeeklyPriorityPlan.id == weekly_plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Weekly plan not found"
        )
    
    from app.modules.monthly_headsup.models import MonthlyHeadsUp
    headsup = db.query(MonthlyHeadsUp).filter(MonthlyHeadsUp.id == plan.monthly_headsup_id).first()
    if not headsup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monthly headsup not found"
        )
    
    if current_user.team_id != headsup.team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only generate tasks for your own team"
        )
    
    try:
        task_output = run_task_generator(db, weekly_plan_id, focus_priority)
        return task_output
    except Exception as e:
        logger.error(f"Error generating tasks: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate tasks: {str(e)}"
        )


@router.post("/generate-and-create")
def generate_and_create_tasks(
    weekly_plan_id: int,
    focus_priority: Optional[int] = Query(None, ge=1, le=3, description="Focus on specific priority (1, 2, or 3)"),
    auto_create: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Generate tasks and optionally create them."""
    # Verify plan exists and user has access
    plan = db.query(WeeklyPriorityPlan).filter(WeeklyPriorityPlan.id == weekly_plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Weekly plan not found"
        )
    
    from app.modules.monthly_headsup.models import MonthlyHeadsUp
    headsup = db.query(MonthlyHeadsUp).filter(MonthlyHeadsUp.id == plan.monthly_headsup_id).first()
    if not headsup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monthly headsup not found"
        )
    
    if current_user.team_id != headsup.team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only generate tasks for your own team"
        )
    
    try:
        # Generate tasks
        task_output = run_task_generator(db, weekly_plan_id, focus_priority)
        
        if not auto_create:
            return {
                "plan": task_output.model_dump(),
                "message": "Tasks generated. Set auto_create=true to automatically create the tasks."
            }
        
        # Create tasks
        created_tasks = []
        for task_suggestion in task_output.tasks:
            try:
                # Verify work item exists and belongs to the plan
                from app.models import WorkItem
                from app.modules.weekly_priority.models import WeeklyPriority
                
                # Check if work item is in the weekly plan
                priority = db.query(WeeklyPriority).filter(
                    WeeklyPriority.plan_id == weekly_plan_id,
                    WeeklyPriority.work_item_id == task_suggestion.work_item_id
                ).first()
                
                if not priority:
                    logger.warning(f"Work item {task_suggestion.work_item_id} not found in weekly plan")
                    continue
                
                # Create task
                new_task = Task(
                    work_item_id=task_suggestion.work_item_id,
                    title=task_suggestion.title,
                    description=task_suggestion.description,
                    assignee_id=task_suggestion.assignee_id,
                    effort_hours=task_suggestion.effort_hours,
                    status="Not Started"
                )
                
                db.add(new_task)
                db.commit()
                db.refresh(new_task)
                
                created_tasks.append({
                    "id": new_task.id,
                    "title": new_task.title,
                    "work_item_id": new_task.work_item_id,
                    "assignee_id": new_task.assignee_id
                })
            except Exception as e:
                logger.warning(f"Failed to create task '{task_suggestion.title}': {str(e)}", exc_info=True)
                db.rollback()
                # Continue with other tasks
                continue
        
        return {
            "plan": task_output.model_dump(),
            "created_tasks": created_tasks,
            "message": f"Successfully created {len(created_tasks)} tasks"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating and creating tasks: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate and create tasks: {str(e)}"
        )

