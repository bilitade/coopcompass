"""Weekly Planner API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.api.v1.deps import get_current_team_lead
from app.modules.users.models import User
from app.modules.ai_engine.weekly_planner.services.runner import run_weekly_planner
from app.modules.ai_engine.weekly_planner.schemas.state import WeeklyPlanOutput
from app.modules.weekly_priority.services import (
    get_weekly_priority_plan_by_week,
    create_weekly_priority_plan,
    create_weekly_priority,
)
from app.modules.weekly_priority.schemas import WeeklyPriorityPlanCreate, WeeklyPriorityCreate
from app.modules.monthly_headsup.models import MonthlyHeadsUp
from app.core.logging_config import logger

router = APIRouter(prefix="/weekly-planner")


@router.post("/generate", response_model=WeeklyPlanOutput)
def generate_weekly_plan(
    monthly_headsup_id: int,
    week: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Generate a weekly plan using AI."""
    # Verify headsup exists and user has access
    headsup = db.query(MonthlyHeadsUp).filter(MonthlyHeadsUp.id == monthly_headsup_id).first()
    if not headsup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monthly headsup not found"
        )
    
    if current_user.team_id != headsup.team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only generate plans for your own team"
        )
    
    # Validate week format (YYYY-W##)
    try:
        year, week_num = week.split("-W")
        week_num = int(week_num)
        if not (1 <= week_num <= 53):
            raise ValueError("Invalid week number")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Week must be in YYYY-W## format (e.g., 2026-W07)"
        )
    
    try:
        weekly_plan = run_weekly_planner(db, monthly_headsup_id, week)
        return weekly_plan
    except Exception as e:
        logger.error(f"Error generating weekly plan: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate weekly plan: {str(e)}"
        )


@router.post("/generate-and-create")
def generate_and_create_weekly_plan(
    monthly_headsup_id: int,
    week: str,
    auto_create: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Generate a weekly plan and optionally create the plan and priorities."""
    # Verify headsup exists and user has access
    headsup = db.query(MonthlyHeadsUp).filter(MonthlyHeadsUp.id == monthly_headsup_id).first()
    if not headsup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monthly headsup not found"
        )
    
    if current_user.team_id != headsup.team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only generate plans for your own team"
        )
    
    # Validate week format
    try:
        year, week_num = week.split("-W")
        week_num = int(week_num)
        if not (1 <= week_num <= 53):
            raise ValueError("Invalid week number")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Week must be in YYYY-W## format (e.g., 2026-W07)"
        )
    
    try:
        # Generate plan
        weekly_plan = run_weekly_planner(db, monthly_headsup_id, week)
        
        if not auto_create:
            return {
                "plan": weekly_plan.model_dump(),
                "message": "Plan generated. Set auto_create=true to automatically create the plan and priorities."
            }
        
        # Check if plan already exists - if so, delete it first (regeneration)
        existing_plan = get_weekly_priority_plan_by_week(db, monthly_headsup_id, week)
        if existing_plan:
            # Delete existing plan and its priorities (cascade will handle priorities)
            from app.modules.weekly_priority.services import delete_weekly_priority_plan
            delete_weekly_priority_plan(db, existing_plan.id)
            logger.info(f"Deleted existing plan for week {week} to allow regeneration")
        
        # Create weekly priority plan
        plan_create = WeeklyPriorityPlanCreate(
            monthly_headsup_id=monthly_headsup_id,
            week=week,
            week_focus=weekly_plan.week_focus
        )
        plan = create_weekly_priority_plan(db, plan_create)
        logger.info(f"Created weekly plan {plan.id} for week {week}")
        
        # Create weekly priorities
        created_priorities = []
        for prioritized_item in weekly_plan.prioritized_work_items:
            try:
                # Verify work item exists and belongs to the headsup
                from app.models import WorkItem
                work_item = db.query(WorkItem).filter(
                    WorkItem.id == prioritized_item.work_item_id,
                    WorkItem.monthly_headsup_id == monthly_headsup_id
                ).first()
                
                if not work_item:
                    logger.warning(f"Work item {prioritized_item.work_item_id} not found for priority")
                    continue
                
                # Create priority
                priority_create = WeeklyPriorityCreate(
                    plan_id=plan.id,
                    work_item_id=prioritized_item.work_item_id,
                    priority=prioritized_item.priority
                )
                priority = create_weekly_priority(db, priority_create)
                
                created_priorities.append({
                    "id": priority.id,
                    "work_item_id": priority.work_item_id,
                    "priority": priority.priority
                })
            except Exception as e:
                logger.warning(f"Failed to create priority for work item {prioritized_item.work_item_id}: {str(e)}", exc_info=True)
                # Don't rollback the entire transaction, just skip this priority
                continue
        
        # Refresh the plan to ensure it's fully committed
        db.refresh(plan)
        
        # Verify the plan was created by querying it back
        verify_plan = get_weekly_priority_plan_by_week(db, monthly_headsup_id, week)
        if not verify_plan:
            logger.error(f"Plan was created but cannot be retrieved. Plan ID: {plan.id}, Week: {week}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Plan was created but cannot be retrieved"
            )
        
        logger.info(f"Successfully created weekly plan {plan.id} (verified) with {len(created_priorities)} priorities")
        
        return {
            "plan": weekly_plan.model_dump(),
            "weekly_plan": {
                "id": plan.id,
                "week": plan.week,
                "week_focus": plan.week_focus
            },
            "priorities_created": created_priorities,
            "message": f"Successfully created weekly plan and {len(created_priorities)} priorities"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating and creating weekly plan: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate and create weekly plan: {str(e)}"
        )

