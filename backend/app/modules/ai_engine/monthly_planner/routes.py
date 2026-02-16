"""Monthly Planner API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.api.v1.deps import get_current_team_lead
from app.modules.users.models import User
from app.modules.ai_engine.monthly_planner.services.runner import run_monthly_planner
from app.modules.ai_engine.monthly_planner.schemas.state import MonthlyPlanOutput
from app.modules.monthly_headsup.services import (
    get_monthly_headsup_by_month,
    create_monthly_headsup,
)
from app.modules.work_items.schemas import WorkItemCreate
from app.models import WorkItem, KeyResult, BAUActivity
from app.core.logging_config import logger

router = APIRouter(prefix="/monthly-planner")


@router.post("/generate", response_model=MonthlyPlanOutput)
def generate_monthly_plan(
    team_id: int,
    month: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Generate a monthly plan using AI."""
    # Verify user has access to this team
    if current_user.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only generate plans for your own team"
        )
    
    # Validate month format (YYYY-MM)
    try:
        year, month_num = map(int, month.split("-"))
        if not (1 <= month_num <= 12):
            raise ValueError("Invalid month")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Month must be in YYYY-MM format"
        )
    
    try:
        monthly_plan = run_monthly_planner(db, team_id, month)
        return monthly_plan
    except Exception as e:
        logger.error(f"Error generating monthly plan: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate monthly plan: {str(e)}"
        )


@router.post("/generate-and-create")
def generate_and_create_monthly_plan(
    team_id: int,
    month: str,
    auto_create: bool = False,  # If True, automatically create the headsup and work items
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Generate a monthly plan and optionally create the headsup and work items."""
    # Verify user has access to this team
    if current_user.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only generate plans for your own team"
        )
    
    # Validate month format
    try:
        year, month_num = map(int, month.split("-"))
        if not (1 <= month_num <= 12):
            raise ValueError("Invalid month")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Month must be in YYYY-MM format"
        )
    
    try:
        # Generate plan
        monthly_plan = run_monthly_planner(db, team_id, month)
        
        if not auto_create:
            return {
                "plan": monthly_plan.model_dump(),
                "message": "Plan generated. Set auto_create=true to automatically create the headsup and work items."
            }
        
        # Check if headsup already exists - if so, delete it first (regeneration)
        existing_headsup = get_monthly_headsup_by_month(db, team_id, month)
        if existing_headsup:
            # Delete existing headsup and its work items (cascade will handle work items)
            from app.modules.monthly_headsup.services import delete_monthly_headsup
            delete_monthly_headsup(db, existing_headsup.id)
            logger.info(f"Deleted existing headsup for {month} to allow regeneration")
        
        # Create monthly headsup
        from app.modules.monthly_headsup.schemas import MonthlyHeadsUpCreate
        headsup_create = MonthlyHeadsUpCreate(
            month=month,
            description=monthly_plan.description,
            focus_areas=monthly_plan.focus_areas,
            strategic_alignment=monthly_plan.strategic_alignment,
            risks_and_considerations=monthly_plan.risks_and_considerations
        )
        headsup = create_monthly_headsup(db, team_id, headsup_create)
        
        # Create work items
        created_work_items = []
        for work_item_suggestion in monthly_plan.work_items:
            try:
                # Verify source exists
                if work_item_suggestion.source_type == "OKR":
                    source = db.query(KeyResult).filter(KeyResult.id == work_item_suggestion.source_id).first()
                else:  # BAU
                    source = db.query(BAUActivity).filter(BAUActivity.id == work_item_suggestion.source_id).first()
                
                if not source:
                    logger.warning(f"Source {work_item_suggestion.source_type} ID {work_item_suggestion.source_id} not found for work item '{work_item_suggestion.title}'")
                    continue
                
                # Create work item
                new_work_item = WorkItem(
                    team_id=team_id,
                    monthly_headsup_id=headsup.id,
                    title=work_item_suggestion.title,
                    description=work_item_suggestion.description,
                    source_type=work_item_suggestion.source_type,
                    source_id=work_item_suggestion.source_id,
                    owner_id=None,  # Can be assigned later
                    status="Not Started"
                )
                
                db.add(new_work_item)
                db.commit()
                db.refresh(new_work_item)
                
                created_work_items.append({
                    "id": new_work_item.id,
                    "title": new_work_item.title,
                    "source_type": new_work_item.source_type,
                    "source_id": new_work_item.source_id
                })
            except Exception as e:
                logger.warning(f"Failed to create work item '{work_item_suggestion.title}': {str(e)}")
                db.rollback()
                # Continue with other work items
        
        return {
            "plan": monthly_plan.model_dump(),
            "headsup": {
                "id": headsup.id,
                "month": headsup.month,
                "description": headsup.description,
                "focus_areas": headsup.focus_areas,
                "strategic_alignment": headsup.strategic_alignment,
                "risks_and_considerations": headsup.risks_and_considerations
            },
            "work_items_created": created_work_items,
            "message": f"Successfully created monthly headsup and {len(created_work_items)} work items"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating and creating monthly plan: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate and create monthly plan: {str(e)}"
        )

