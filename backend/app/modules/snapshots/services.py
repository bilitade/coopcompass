"""Snapshot service logic."""

from sqlalchemy.orm import Session
from typing import Dict, Optional, List, Any
from decimal import Decimal
from datetime import datetime
# Import models directly from modules to avoid circular imports
from app.modules.snapshots.models import WeeklySnapshot
from app.modules.teams.models import Team
from app.modules.okrs.models import OKR, KeyResult
from app.modules.bau.models import BAUActivity, BAUMetric
from app.modules.weekly_priority.models import WeeklyPriorityPlan, WeeklyPriority
from app.modules.work_items.models import WorkItem
from app.modules.tasks.models import Task
from app.modules.users.models import User
from app.modules.monthly_headsup.models import MonthlyHeadsUp
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
    
    # ===== TEAM CONTEXT =====
    snapshot.team_name = team.name
    
    # Get team members (active users)
    team_users = db.query(User).filter(
        User.team_id == team_id,
        User.is_active == True
    ).all()
    
    snapshot.team_size = len(team_users)
    
    # Get team manager/lead
    manager = next((u for u in team_users if u.role == 'lead'), None)
    if manager:
        snapshot.manager_id = manager.id
        snapshot.manager_name = manager.name
    else:
        snapshot.manager_id = None
        snapshot.manager_name = None
    
    # Store team members as JSON
    team_members_data = serialize_for_json([
        {
            'id': user.id,
            'name': user.name,
            'role': user.role,
            'position': user.position
        }
        for user in team_users
    ])
    snapshot.team_members = team_members_data
    
    # ===== OKR CONTEXT & SCORES =====
    # Get active OKR for current quarter
    okr = db.query(OKR).filter(
        OKR.team_id == team_id,
        OKR.quarter == quarter,
        OKR.is_active == True
    ).first()
    
    if okr:
        snapshot.okr_id = okr.id
        snapshot.okr_objective = okr.objective
        snapshot.okr_target_score = Decimal('0.7')  # Standard target score
        
        okr_with_scores = get_okr_with_scores(db, okr.id)
        if okr_with_scores:
            current_score = Decimal(str(okr_with_scores['objective_score']))
            snapshot.okr_current_score = current_score
            snapshot.okr_objective_score = current_score  # Legacy field
            
            # Store up to 5 key result scores (legacy fields)
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
            
            # Store key results in JSONB format per specification
            okr_key_results_data = serialize_for_json([
                {
                    'id': kr['id'],
                    'description': kr['description'],
                    'base': float(kr['base_value']),
                    'target': float(kr['target_value']),
                    'current': float(kr['current_value']),
                    'unit': kr['unit'],
                    'weight': float(kr['weight']),
                    'score': float(kr['score'])
                }
                for kr in key_results
            ])
            snapshot.okr_key_results = okr_key_results_data
            
            # Legacy field for backward compatibility
            snapshot.okr_data = serialize_for_json({
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
        snapshot.okr_id = None
        snapshot.okr_objective = None
        snapshot.okr_target_score = None
        snapshot.okr_current_score = None
        snapshot.okr_objective_score = None
        snapshot.okr_key_results = None
        snapshot.okr_data = None
    
    # ===== BAU CONTEXT & SCORES =====
    bau_health_data = get_team_bau_health(db, team_id)
    if bau_health_data and bau_health_data.get('overall_health') is not None:
        snapshot.bau_overall_health = Decimal(str(bau_health_data['overall_health']))
        
        # Store BAU activities in JSONB format per specification
        activities_data = []
        for activity in bau_health_data.get('activities', []):
            activity_clean = {
                'id': activity.get('id'),
                'name': activity.get('name'),
                'score': float(activity.get('activity_score', 0)),
                'metrics': []
            }
            
            # Add metrics with clean structure
            if 'metrics' in activity:
                for metric in activity['metrics']:
                    activity_clean['metrics'].append({
                        'name': metric.get('name'),
                        'target': float(metric.get('target_value', 0)),
                        'current': float(metric.get('current_value', 0)),
                        'achievement': float(metric.get('achievement', 0))
                    })
            
            activities_data.append(activity_clean)
        
        snapshot.bau_activities = serialize_for_json(activities_data)
        
        # Legacy field for backward compatibility
        snapshot.bau_data = serialize_for_json({
            'overall_health': float(bau_health_data['overall_health']),
            'status': bau_health_data.get('status', 'Unknown'),
            'activities': bau_health_data.get('activities', [])
        })
    else:
        snapshot.bau_overall_health = None
        snapshot.bau_activities = None
        snapshot.bau_data = None
    
    # ===== WORK ITEMS & WEEKLY PRIORITY PLAN =====
    # Find weekly priority plan for this week
    monthly_headsups = db.query(MonthlyHeadsUp).filter(
        MonthlyHeadsUp.team_id == team_id
    ).all()
    
    work_items_planned_list = []
    work_items_completed_list = []
    weekly_priority_plan_data = None
    
    for headsup in monthly_headsups:
        weekly_plan = db.query(WeeklyPriorityPlan).filter(
            WeeklyPriorityPlan.monthly_headsup_id == headsup.id,
            WeeklyPriorityPlan.week == week
        ).first()
        
        if weekly_plan:
            # Store weekly priority plan
            if not weekly_priority_plan_data:
                weekly_priority_plan_data = {
                    'week_focus': weekly_plan.week_focus,
                    'p1_items': [],
                    'p2_items': [],
                    'p3_items': []
                }
            
            # Get all priorities (P1, P2, P3) for this week
            priorities = db.query(WeeklyPriority).filter(
                WeeklyPriority.plan_id == weekly_plan.id
            ).all()
            
            for priority in priorities:
                work_item = db.query(WorkItem).filter(
                    WorkItem.id == priority.work_item_id
                ).first()
                
                if work_item:
                    # Get source name
                    source_name = None
                    if work_item.source_type == 'OKR':
                        kr = db.query(KeyResult).filter(KeyResult.id == work_item.source_id).first()
                        if kr:
                            source_name = f"KR: {kr.description}"
                    elif work_item.source_type == 'BAU':
                        bau = db.query(BAUActivity).filter(BAUActivity.id == work_item.source_id).first()
                        if bau:
                            source_name = bau.name
                    
                    work_item_data = {
                        'id': work_item.id,
                        'title': work_item.title,
                        'source_type': work_item.source_type,
                        'source_name': source_name or f"Unknown (ID: {work_item.source_id})",
                        'priority': f"P{priority.priority}"
                    }
                    
                    # Add to planned list
                    work_items_planned_list.append(work_item_data)
                    
                    # Add to priority plan
                    if priority.priority == 1:
                        weekly_priority_plan_data['p1_items'].append({
                            'id': work_item.id,
                            'title': work_item.title
                        })
                    elif priority.priority == 2:
                        weekly_priority_plan_data['p2_items'].append({
                            'id': work_item.id,
                            'title': work_item.title
                        })
                    elif priority.priority == 3:
                        weekly_priority_plan_data['p3_items'].append({
                            'id': work_item.id,
                            'title': work_item.title
                        })
                    
                    # If completed, add to completed list
                    if work_item.status == "Completed":
                        work_items_completed_list.append(work_item_data)
    
    # Store work items data
    snapshot.work_items_planned = serialize_for_json(work_items_planned_list)
    snapshot.work_items_completed = serialize_for_json(work_items_completed_list)
    snapshot.work_items_count_planned = len(work_items_planned_list)
    snapshot.work_items_count_completed = len(work_items_completed_list)
    
    if snapshot.work_items_count_planned > 0:
        completion_rate = (snapshot.work_items_count_completed / snapshot.work_items_count_planned) * 100
        snapshot.work_items_completion_rate = Decimal(str(round(completion_rate, 2)))
    else:
        snapshot.work_items_completion_rate = None
    
    # Store weekly priority plan
    snapshot.weekly_priority_plan = serialize_for_json(weekly_priority_plan_data) if weekly_priority_plan_data else None
    
    # ===== TASKS DATA =====
    # Get all tasks for work items in this week's plan
    tasks_list = []
    
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
                        # Get assignee name
                        assignee_name = None
                        if task.assignee_id:
                            assignee = db.query(User).filter(User.id == task.assignee_id).first()
                            if assignee:
                                assignee_name = assignee.name
                        
                        task_data = {
                            'id': task.id,
                            'description': task.description,
                            'title': task.title,
                            'assignee': assignee_name or 'Unassigned',
                            'status': task.status,
                            'work_item_id': task.work_item_id,
                            'effort_hours': int(task.effort_hours) if task.effort_hours else None
                        }
                        
                        tasks_list.append(task_data)
    
    # Store tasks data
    snapshot.tasks = serialize_for_json(tasks_list)
    snapshot.tasks_count_planned = len(tasks_list)
    snapshot.tasks_count_completed = len([t for t in tasks_list if t.get('status') == 'Done'])
    snapshot.tasks_planned = snapshot.tasks_count_planned  # Legacy field
    snapshot.tasks_completed = snapshot.tasks_count_completed  # Legacy field
    
    if snapshot.tasks_count_planned > 0:
        completion_rate = (snapshot.tasks_count_completed / snapshot.tasks_count_planned) * 100
        snapshot.tasks_completion_rate = Decimal(str(round(completion_rate, 2)))
    else:
        snapshot.tasks_completion_rate = None
    
    # Set snapshot version
    snapshot.snapshot_version = '1.0'
    
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

