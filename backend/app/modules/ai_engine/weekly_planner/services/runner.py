"""Service to run weekly planner graph."""
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import datetime, date

from app.core.logging_config import logger
from app.modules.ai_engine.weekly_planner.services.graph import build_weekly_planner_graph
from app.modules.ai_engine.weekly_planner.schemas.state import WeeklyContext, WeeklyPlanOutput, WorkItemContext
from app.models import MonthlyHeadsUp, WorkItem, WeeklyPriorityPlan, WeeklyPriority, Team, OKR, BAUActivity
from app.modules.okrs.services import calculate_okr_progress, calculate_kr_progress
from app.modules.bau.services import get_bau_activity_with_scores
from app.modules.work_items.services import calculate_work_item_progress


def get_week_number_in_month(week: str, month: str) -> int:
    """Calculate which week of the month this is (1-4 or 5)."""
    try:
        # Parse week (YYYY-W##)
        year, week_num = map(int, week.split("-W"))
        
        # Get the Monday of the week
        jan4 = date(year, 1, 4)
        jan4_day = jan4.weekday()  # 0=Monday, 6=Sunday
        days_to_monday = (7 - jan4_day) % 7
        first_monday = date(year, 1, 4 + days_to_monday)
        
        # Calculate the Monday of the target week
        week_date = date.fromisocalendar(year, week_num, 1)  # Monday of the week
        
        # Parse month (YYYY-MM)
        month_year, month_num = map(int, month.split("-"))
        
        # Find which Monday of the month this is
        first_monday_of_month = date(month_year, month_num, 1)
        # Find the first Monday of the month
        days_until_monday = (7 - first_monday_of_month.weekday()) % 7
        if days_until_monday == 7:
            days_until_monday = 0
        first_monday_of_month = date(month_year, month_num, 1 + days_until_monday)
        
        # Calculate week number in month
        if week_date < first_monday_of_month:
            return 1  # This week belongs to previous month, but we'll count it as week 1
        
        week_number = ((week_date - first_monday_of_month).days // 7) + 1
        return min(week_number, 5)  # Cap at 5 (some months have 5 weeks)
    except Exception as e:
        logger.warning(f"Error calculating week number in month: {e}, defaulting to 1")
        return 1


def get_previous_week(current_week: str) -> str:
    """Get previous week in YYYY-W## format."""
    try:
        year, week = map(int, current_week.split("-W"))
        if week == 1:
            # Previous week is last week of previous year
            return f"{year - 1}-W52"
        else:
            return f"{year}-W{week - 1:02d}"
    except:
        return current_week


def collect_weekly_context(
    db: Session,
    monthly_headsup_id: int,
    week: str
) -> WeeklyContext:
    """Collect weekly planning context."""
    logger.info(f"[WEEKLY_PLANNER] Collecting context for headsup {monthly_headsup_id}, week {week}")
    
    # Get monthly headsup
    headsup = db.query(MonthlyHeadsUp).filter(MonthlyHeadsUp.id == monthly_headsup_id).first()
    if not headsup:
        raise ValueError(f"Monthly headsup {monthly_headsup_id} not found")
    
    month = headsup.month
    week_number = get_week_number_in_month(week, month)
    
    # Get work items from monthly headsup
    work_items = db.query(WorkItem).filter(
        WorkItem.monthly_headsup_id == monthly_headsup_id
    ).all()
    
    work_items_context = []
    for item in work_items:
        progress = calculate_work_item_progress(db, item.id)
        owner_name = None
        if item.owner_id:
            from app.models import User
            owner = db.query(User).filter(User.id == item.owner_id).first()
            owner_name = owner.full_name if owner else None
        
        # Get source name
        source_name = "Unknown"
        if item.source_type == "OKR":
            from app.models import KeyResult
            kr = db.query(KeyResult).filter(KeyResult.id == item.source_id).first()
            if kr:
                source_name = kr.description
        elif item.source_type == "BAU":
            bau = db.query(BAUActivity).filter(BAUActivity.id == item.source_id).first()
            if bau:
                source_name = bau.name
        
        work_items_context.append(WorkItemContext(
            id=item.id,
            title=item.title,
            description=item.description,
            source_type=item.source_type,
            source_id=item.source_id,
            source_name=source_name,
            status=item.status,
            progress=progress,
            owner_id=item.owner_id,
            owner_name=owner_name,
            created_at=item.created_at.isoformat() if item.created_at else ""
        ))
    
    # Get previous week's priorities
    previous_week = get_previous_week(week)
    previous_plan = db.query(WeeklyPriorityPlan).filter(
        WeeklyPriorityPlan.monthly_headsup_id == monthly_headsup_id,
        WeeklyPriorityPlan.week == previous_week
    ).first()
    
    previous_week_priorities = []
    if previous_plan:
        priorities = db.query(WeeklyPriority).filter(
            WeeklyPriority.plan_id == previous_plan.id
        ).all()
        
        for priority in priorities:
            work_item = db.query(WorkItem).filter(WorkItem.id == priority.work_item_id).first()
            if work_item:
                previous_week_priorities.append({
                    "work_item_id": work_item.id,
                    "work_item_title": work_item.title,
                    "priority": priority.priority,
                    "status": work_item.status
                })
    
    # Get team context for OKR and BAU progress
    team = db.query(Team).filter(Team.id == headsup.team_id).first()
    okr_progress = {}
    bau_health = {}
    
    if team:
        # Get OKR progress
        current_year = int(month.split("-")[0])
        okrs = db.query(OKR).filter(
            OKR.team_id == team.id,
            OKR.is_active == True,
            OKR.year == current_year
        ).all()
        
        for okr in okrs:
            progress = calculate_okr_progress(db, okr.id)
            okr_progress[f"OKR-{okr.id}"] = progress
        
        # Get BAU health
        bau_activities = db.query(BAUActivity).filter(
            BAUActivity.team_id == team.id,
            BAUActivity.is_active == True
        ).all()
        
        for activity in bau_activities:
            activity_data = get_bau_activity_with_scores(db, activity.id)
            if activity_data:
                health_score = activity_data.get("activity_score", 0.0)
                bau_health[f"BAU-{activity.id}"] = health_score
    
    # Get focus areas
    focus_areas = headsup.focus_areas if headsup.focus_areas else []
    
    return WeeklyContext(
        monthly_headsup_id=monthly_headsup_id,
        month=month,
        week=week,
        week_number=week_number,
        monthly_description=headsup.description or "",
        monthly_focus_areas=focus_areas,
        work_items=work_items_context,
        previous_week_priorities=previous_week_priorities,
        current_okr_progress=okr_progress,
        current_bau_health=bau_health
    )


def run_weekly_planner(
    db: Session,
    monthly_headsup_id: int,
    week: str,
    progress_callback: Optional[Any] = None
) -> WeeklyPlanOutput:
    """Run the weekly planner graph."""
    logger.info(f"[WEEKLY_PLANNER] Running planner for headsup {monthly_headsup_id}, week {week}")
    
    # Collect context
    weekly_context = collect_weekly_context(db, monthly_headsup_id, week)
    
    # Build and run graph
    graph = build_weekly_planner_graph()
    
    initial_state: Dict[str, Any] = {
        "weekly_context": weekly_context,
        "progress_callback": progress_callback
    }
    
    result = graph.invoke(initial_state)
    
    weekly_plan = result.get("weekly_plan")
    if not weekly_plan:
        raise ValueError("Failed to generate weekly plan")
    
    return weekly_plan

