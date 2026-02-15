"""Snapshot service logic."""

from sqlalchemy.orm import Session
from typing import Dict, Optional, List, Any
from decimal import Decimal
from datetime import datetime
from app.models import (
    WeeklySnapshot, Team, OKR, KeyResult, BAUActivity, BAUMetric,
    WeeklyPriorityPlan, WeeklyPriority, WorkItem, Task, User, MonthlyHeadsUp
)
from app.services.calculations import (
    get_current_quarter, get_current_week,
    calculate_kr_score, calculate_objective_score,
    calculate_bau_metric_achievement, calculate_bau_activity_score,
    calculate_bau_overall_health
)
from app.modules.okrs.services import get_okr_with_scores
from app.modules.bau.services import get_bau_activity_with_scores, get_team_bau_health


def serialize_for_json(obj: Any) -> Any:
    """
    Recursively serialize objects for JSON storage.
    Converts datetime objects to ISO format strings and Decimal to float.
    """
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: serialize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [serialize_for_json(item) for item in obj]
    else:
        return obj


def get_quarter_from_week(week: str) -> str:
    """Extract quarter from week string (e.g., 2026-W07 -> Q1 2026)."""
    try:
        year = int(week.split('-W')[0])
        week_num = int(week.split('-W')[1])
        
        # Calculate quarter from week number
        # Week 1-13 = Q1, Week 14-26 = Q2, Week 27-39 = Q3, Week 40-52 = Q4
        if week_num <= 13:
            quarter = 1
        elif week_num <= 26:
            quarter = 2
        elif week_num <= 39:
            quarter = 3
        else:
            quarter = 4
        
        return f"Q{quarter} {year}"
    except:
        return get_current_quarter()


def create_weekly_snapshot(db: Session, team_id: int, week: Optional[str] = None) -> WeeklySnapshot:
    """
    Create a weekly snapshot for a team.
    
    Captures:
    - OKR scores (objective + up to 5 key results)
    - BAU health
    - Work items planned/completed for the week
    - Tasks planned/completed for the week
    - Team size
    
    Args:
        db: Database session
        team_id: Team ID
        week: Week string (e.g., "2026-W07"). If None, uses current week.
    
    Returns:
        Created WeeklySnapshot
    """
    if week is None:
        week = get_current_week()
    
    quarter = get_quarter_from_week(week)
    
    # Check if snapshot already exists
    existing = db.query(WeeklySnapshot).filter(
        WeeklySnapshot.team_id == team_id,
        WeeklySnapshot.week == week
    ).first()
    
    if existing:
        # Update existing snapshot
        snapshot = existing
    else:
        snapshot = WeeklySnapshot(
            team_id=team_id,
            week=week,
            quarter=quarter
        )
        db.add(snapshot)
    
    # Get team
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise ValueError(f"Team {team_id} not found")
    
    # Get team size (active users)
    team_size = db.query(User).filter(
        User.team_id == team_id,
        User.is_active == True
    ).count()
    snapshot.team_size = team_size
    
    # ===== OKR DATA =====
    # Get active OKR for current quarter
    okr = db.query(OKR).filter(
        OKR.team_id == team_id,
        OKR.quarter == quarter,
        OKR.is_active == True
    ).first()
    
    okr_data = None
    if okr:
        okr_with_scores = get_okr_with_scores(db, okr.id)
        if okr_with_scores:
            snapshot.okr_objective_score = Decimal(str(okr_with_scores['objective_score']))
            
            # Store up to 5 key result scores
            key_results = okr_with_scores.get('key_results', [])
            for i, kr in enumerate(key_results[:5], 1):
                score = Decimal(str(kr['score']))
                if i == 1:
                    snapshot.kr1_score = score
                elif i == 2:
                    snapshot.kr2_score = score
                elif i == 3:
                    snapshot.kr3_score = score
                elif i == 4:
                    snapshot.kr4_score = score
                elif i == 5:
                    snapshot.kr5_score = score
            
            okr_data = serialize_for_json({
                'objective': okr_with_scores['objective'],
                'objective_score': float(okr_with_scores['objective_score']),
                'status': okr_with_scores.get('status', 'Unknown'),
                'key_results': [
                    {
                        'id': kr['id'],
                        'description': kr['description'],
                        'score': float(kr['score']),
                        'weight': float(kr['weight']),
                        'current_value': float(kr['current_value']),
                        'target_value': float(kr['target_value']),
                        'base_value': float(kr['base_value']),
                        'unit': kr['unit']
                    }
                    for kr in key_results
                ]
            })
    else:
        snapshot.okr_objective_score = None
    
    snapshot.okr_data = okr_data
    
    # ===== BAU DATA =====
    bau_health_data = get_team_bau_health(db, team_id)
    if bau_health_data and bau_health_data.get('overall_health') is not None:
        snapshot.bau_overall_health = Decimal(str(bau_health_data['overall_health']))
        snapshot.bau_data = serialize_for_json({
            'overall_health': float(bau_health_data['overall_health']),
            'status': bau_health_data.get('status', 'Unknown'),
            'activities': bau_health_data.get('activities', [])
        })
    else:
        snapshot.bau_overall_health = None
        snapshot.bau_data = None
    
    # ===== WORK ITEMS DATA =====
    # Find weekly priority plan for this week
    # We need to find plans that match this week across all monthly heads-ups for this team
    monthly_headsups = db.query(MonthlyHeadsUp).filter(
        MonthlyHeadsUp.team_id == team_id
    ).all()
    
    work_items_planned = 0
    work_items_completed = 0
    
    for headsup in monthly_headsups:
        weekly_plan = db.query(WeeklyPriorityPlan).filter(
            WeeklyPriorityPlan.monthly_headsup_id == headsup.id,
            WeeklyPriorityPlan.week == week
        ).first()
        
        if weekly_plan:
            # Get all priorities (P1, P2, P3) for this week
            priorities = db.query(WeeklyPriority).filter(
                WeeklyPriority.plan_id == weekly_plan.id
            ).all()
            
            for priority in priorities:
                work_item = db.query(WorkItem).filter(
                    WorkItem.id == priority.work_item_id
                ).first()
                
                if work_item:
                    work_items_planned += 1
                    if work_item.status == "Completed":
                        work_items_completed += 1
    
    snapshot.work_items_planned = work_items_planned
    snapshot.work_items_completed = work_items_completed
    
    if work_items_planned > 0:
        completion_rate = (work_items_completed / work_items_planned) * 100
        snapshot.work_items_completion_rate = Decimal(str(round(completion_rate, 2)))
    else:
        snapshot.work_items_completion_rate = None
    
    # ===== TASKS DATA =====
    # Count tasks created this week and completed
    # Tasks are linked to work items, so we need to find tasks for work items in this week's plan
    tasks_planned = 0
    tasks_completed = 0
    
    for headsup in monthly_headsups:
        weekly_plan = db.query(WeeklyPriorityPlan).filter(
            WeeklyPriorityPlan.monthly_headsup_id == headsup.id,
            WeeklyPriorityPlan.week == week
        ).first()
        
        if weekly_plan:
            priorities = db.query(WeeklyPriority).filter(
                WeeklyPriority.plan_id == weekly_plan.id
            ).all()
            
            for priority in priorities:
                work_item = db.query(WorkItem).filter(
                    WorkItem.id == priority.work_item_id
                ).first()
                
                if work_item:
                    # Get all tasks for this work item
                    tasks = db.query(Task).filter(
                        Task.work_item_id == work_item.id
                    ).all()
                    
                    for task in tasks:
                        # Check if task was created this week (or is part of this week's plan)
                        tasks_planned += 1
                        if task.status == "Done":
                            tasks_completed += 1
    
    snapshot.tasks_planned = tasks_planned
    snapshot.tasks_completed = tasks_completed
    
    if tasks_planned > 0:
        completion_rate = (tasks_completed / tasks_planned) * 100
        snapshot.tasks_completion_rate = Decimal(str(round(completion_rate, 2)))
    else:
        snapshot.tasks_completion_rate = None
    
    try:
        db.commit()
        db.refresh(snapshot)
    except Exception as e:
        db.rollback()
        raise Exception(f"Failed to save snapshot: {str(e)}")
    
    return snapshot


def get_team_snapshots(
    db: Session,
    team_id: int,
    quarter: Optional[str] = None,
    limit: Optional[int] = None
) -> List[WeeklySnapshot]:
    """
    Get snapshots for a team.
    
    Args:
        db: Database session
        team_id: Team ID
        quarter: Optional quarter filter (e.g., "Q1 2026")
        limit: Optional limit on number of results
    
    Returns:
        List of WeeklySnapshot objects
    """
    query = db.query(WeeklySnapshot).filter(
        WeeklySnapshot.team_id == team_id
    )
    
    if quarter:
        query = query.filter(WeeklySnapshot.quarter == quarter)
    
    query = query.order_by(WeeklySnapshot.week.desc())
    
    if limit:
        query = query.limit(limit)
    
    return query.all()


def get_snapshot_by_week(
    db: Session,
    team_id: int,
    week: str
) -> Optional[WeeklySnapshot]:
    """Get a specific snapshot by team and week."""
    return db.query(WeeklySnapshot).filter(
        WeeklySnapshot.team_id == team_id,
        WeeklySnapshot.week == week
    ).first()


def create_snapshots_for_all_teams(db: Session, week: Optional[str] = None) -> List[WeeklySnapshot]:
    """
    Create snapshots for all active teams.
    
    Args:
        db: Database session
        week: Week string. If None, uses current week.
    
    Returns:
        List of created snapshots
    """
    teams = db.query(Team).all()
    snapshots = []
    
    for team in teams:
        try:
            snapshot = create_weekly_snapshot(db, team.id, week)
            snapshots.append(snapshot)
        except Exception as e:
            # Log error but continue with other teams
            print(f"Error creating snapshot for team {team.id}: {e}")
            continue
    
    return snapshots

