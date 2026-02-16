"""Service to run task generator graph."""
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from app.core.logging_config import logger
from app.modules.ai_engine.task_generator.services.graph import build_task_generator_graph
from app.modules.ai_engine.task_generator.schemas.state import (
    TaskGenerationContext,
    TaskGenerationOutput,
    WorkItemPriorityContext,
    TeamMemberContext,
)
from app.models import WeeklyPriorityPlan, WeeklyPriority, WorkItem, Task, Team, User


def collect_task_generation_context(
    db: Session,
    weekly_plan_id: int,
    focus_priority: Optional[int] = None
) -> TaskGenerationContext:
    """Collect context for task generation."""
    logger.info(f"[TASK_GENERATOR] Collecting context for weekly plan {weekly_plan_id}")
    
    # Get weekly plan
    plan = db.query(WeeklyPriorityPlan).filter(WeeklyPriorityPlan.id == weekly_plan_id).first()
    if not plan:
        raise ValueError(f"Weekly plan {weekly_plan_id} not found")
    
    # Get priorities for this plan
    priorities_query = db.query(WeeklyPriority).filter(WeeklyPriority.plan_id == weekly_plan_id)
    if focus_priority:
        priorities_query = priorities_query.filter(WeeklyPriority.priority == focus_priority)
    
    priorities = priorities_query.all()
    
    # Build work items context
    work_items_context = []
    for priority in priorities:
        work_item = db.query(WorkItem).filter(WorkItem.id == priority.work_item_id).first()
        if not work_item:
            continue
        
        # Get existing tasks for this work item
        existing_tasks = db.query(Task).filter(Task.work_item_id == work_item.id).all()
        existing_tasks_data = [{
            "id": task.id,
            "title": task.title,
            "status": task.status,
            "assignee_id": task.assignee_id
        } for task in existing_tasks]
        
        # Get source name
        source_name = "Unknown"
        if work_item.source_type == "OKR":
            from app.models import KeyResult
            kr = db.query(KeyResult).filter(KeyResult.id == work_item.source_id).first()
            if kr:
                source_name = kr.description
        elif work_item.source_type == "BAU":
            from app.models import BAUActivity
            bau = db.query(BAUActivity).filter(BAUActivity.id == work_item.source_id).first()
            if bau:
                source_name = bau.name
        
        # Calculate progress
        from app.modules.work_items.services import calculate_work_item_progress
        progress = calculate_work_item_progress(db, work_item.id)
        
        work_items_context.append(WorkItemPriorityContext(
            work_item_id=work_item.id,
            title=work_item.title,
            description=work_item.description,
            priority=priority.priority,
            source_type=work_item.source_type,
            source_name=source_name,
            status=work_item.status,
            progress=progress,
            existing_tasks=existing_tasks_data
        ))
    
    # Get team members
    from app.modules.monthly_headsup.models import MonthlyHeadsUp
    headsup = db.query(MonthlyHeadsUp).filter(MonthlyHeadsUp.id == plan.monthly_headsup_id).first()
    if not headsup:
        raise ValueError(f"Monthly headsup not found for plan {weekly_plan_id}")
    
    team = db.query(Team).filter(Team.id == headsup.team_id).first()
    team_members_context = []
    
    if team:
        members = db.query(User).filter(User.team_id == team.id).all()
        for member in members:
            # Count active tasks (Not Started or In Progress)
            active_tasks = db.query(Task).filter(
                Task.assignee_id == member.id,
                Task.status.in_(["Not Started", "In Progress"])
            ).count()
            
            team_members_context.append(TeamMemberContext(
                id=member.id,
                name=member.name or member.email,
                email=member.email,
                role=member.role or "member",
                current_workload=active_tasks
            ))
    
    return TaskGenerationContext(
        weekly_plan_id=weekly_plan_id,
        week=plan.week,
        week_focus=plan.week_focus,
        work_items=work_items_context,
        team_members=team_members_context,
        focus_priority=focus_priority
    )


def run_task_generator(
    db: Session,
    weekly_plan_id: int,
    focus_priority: Optional[int] = None,
    progress_callback: Optional[Any] = None
) -> TaskGenerationOutput:
    """Run the task generator graph."""
    logger.info(f"[TASK_GENERATOR] Running generator for weekly plan {weekly_plan_id}")
    
    # Collect context
    task_context = collect_task_generation_context(db, weekly_plan_id, focus_priority)
    
    # Build and run graph
    graph = build_task_generator_graph()
    
    initial_state: Dict[str, Any] = {
        "task_context": task_context,
        "progress_callback": progress_callback
    }
    
    result = graph.invoke(initial_state)
    
    task_output = result.get("task_output")
    if not task_output:
        raise ValueError("Failed to generate tasks")
    
    return task_output

