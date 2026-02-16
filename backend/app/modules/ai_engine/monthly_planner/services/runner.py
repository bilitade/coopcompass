"""Service to run monthly planner graph."""
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from app.core.logging_config import logger
from app.modules.ai_engine.monthly_planner.services.graph import build_monthly_planner_graph
from app.modules.ai_engine.monthly_planner.schemas.state import TeamContext, MonthlyPlanOutput
from app.models import OKR, BAUActivity, WorkItem, MonthlyHeadsUp, Team
from app.modules.okrs.services import calculate_okr_progress, calculate_kr_progress
from app.modules.bau.services import get_bau_activity_with_scores


def get_previous_month(month: str) -> str:
    """Get previous month in YYYY-MM format."""
    year, month_num = map(int, month.split("-"))
    if month_num == 1:
        return f"{year - 1}-12"
    else:
        return f"{year}-{month_num - 1:02d}"


def collect_team_context(
    db: Session,
    team_id: int,
    month: str
) -> TeamContext:
    """Collect team context for monthly planning."""
    logger.info(f"[MONTHLY_PLANNER] Collecting context for team {team_id}, month {month}")
    
    # Get team name
    team = db.query(Team).filter(Team.id == team_id).first()
    team_name = team.name if team else f"Team {team_id}"
    
    # Get active OKRs for the current quarter/year
    current_year = int(month.split("-")[0])
    okrs = db.query(OKR).filter(
        OKR.team_id == team_id,
        OKR.is_active == True,
        OKR.year == current_year
    ).all()
    
    okrs_data = []
    okr_progress = {}
    
    for okr in okrs:
        progress = calculate_okr_progress(db, okr.id)
        okr_progress[f"OKR-{okr.id}"] = progress
        
        kr_data = []
        for kr in okr.key_results:
            kr_progress = calculate_kr_progress(db, kr.id)
            kr_data.append({
                "id": kr.id,
                "description": kr.description,
                "progress": kr_progress,
                "current_value": float(kr.current_value) if kr.current_value else 0.0,
                "target_value": float(kr.target_value),
                "unit": kr.unit
            })
        
        okrs_data.append({
            "id": okr.id,
            "objective": okr.objective,
            "quarter": okr.quarter or f"Q{((int(month.split('-')[1]) - 1) // 3) + 1}",
            "status": okr.status,
            "progress": progress,
            "key_results": kr_data
        })
    
    # Get BAU activities
    bau_activities = db.query(BAUActivity).filter(
        BAUActivity.team_id == team_id,
        BAUActivity.is_active == True
    ).all()
    
    bau_data = []
    bau_health = {}
    
    for activity in bau_activities:
        activity_data = get_bau_activity_with_scores(db, activity.id)
        if activity_data:
            health_score = activity_data.get("activity_score", 0.0)
            bau_health[f"BAU-{activity.id}"] = health_score
            
            metrics_data = []
            for metric in activity_data.get("metrics", []):
                metrics_data.append({
                    "name": metric.get("name", ""),
                    "score": metric.get("score", 0.0),
                    "current_value": float(metric.get("current_value", 0)),
                    "target_value": float(metric.get("target_value", 0)),
                    "unit": metric.get("unit", "")
                })
            
            bau_data.append({
                "id": activity.id,
                "name": activity.name,
                "description": activity.description or "",
                "health_score": health_score,
                "metrics": metrics_data
            })
    
    # Get previous month's work items
    previous_month = get_previous_month(month)
    previous_headsup = db.query(MonthlyHeadsUp).filter(
        MonthlyHeadsUp.team_id == team_id,
        MonthlyHeadsUp.month == previous_month
    ).first()
    
    previous_work_items = []
    if previous_headsup:
        work_items = db.query(WorkItem).filter(
            WorkItem.monthly_headsup_id == previous_headsup.id
        ).all()
        
        previous_work_items = [{
            "id": item.id,
            "title": item.title,
            "description": item.description or "",
            "status": item.status,
            "source_type": item.source_type
        } for item in work_items]
    
    return TeamContext(
        team_id=team_id,
        team_name=team_name,
        month=month,
        okrs=okrs_data,
        bau_activities=bau_data,
        previous_month_work_items=previous_work_items,
        current_okr_progress=okr_progress,
        current_bau_health=bau_health
    )


def run_monthly_planner(
    db: Session,
    team_id: int,
    month: str,
    progress_callback: Optional[Any] = None
) -> MonthlyPlanOutput:
    """Run the monthly planner graph."""
    logger.info(f"[MONTHLY_PLANNER] Running planner for team {team_id}, month {month}")
    
    # Collect context
    team_context = collect_team_context(db, team_id, month)
    
    # Build and run graph
    graph = build_monthly_planner_graph()
    
    initial_state: Dict[str, Any] = {
        "team_context": team_context,
        "progress_callback": progress_callback
    }
    
    result = graph.invoke(initial_state)
    
    monthly_plan = result.get("monthly_plan")
    if not monthly_plan:
        raise ValueError("Failed to generate monthly plan")
    
    return monthly_plan

