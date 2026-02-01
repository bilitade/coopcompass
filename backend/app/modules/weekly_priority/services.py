"""Weekly Priority service logic."""

from sqlalchemy.orm import Session
from datetime import datetime
from app.models import OKR, Team, Department, User, WeeklyPriority, WorkItem
from app.modules.okrs.services import calculate_okr_progress, calculate_kr_progress
from app.modules.bau.services import calculate_bau_health, calculate_bau_execution
from app.modules.work_items.services import calculate_work_item_progress
from app.services.calculations import get_current_quarter, get_current_week


def get_team_dashboard(db: Session, team_id: int) -> dict:
    """Get complete dashboard data for a team."""
    # Get current quarter OKR
    current_quarter = get_current_quarter()
    
    okr = db.query(OKR).filter(
        OKR.team_id == team_id,
        OKR.quarter == current_quarter,
        OKR.is_active == True
    ).first()
    
    okr_progress = calculate_okr_progress(db, okr.id) if okr else 0.0
    
    # Build OKR details
    okrs_data = []
    if okr:
        kr_data = []
        for kr in okr.key_results:
            kr_progress = calculate_kr_progress(db, kr.id)
            kr_data.append({
                "kr_id": kr.id,
                "description": kr.description,
                "progress": kr_progress,
                "current_value": float(kr.current_value) if kr.current_value else 0.0,
                "target_value": float(kr.target_value)
            })
        
        okrs_data.append({
            "okr_id": okr.id,
            "objective": okr.objective,
            "quarter": okr.quarter,
            "progress": okr_progress,
            "key_results": kr_data
        })
    
    # Get BAU activities
    from app.models import BAUActivity
    bau_activities = db.query(BAUActivity).filter(
        BAUActivity.team_id == team_id,
        BAUActivity.is_active == True
    ).all()
    
    bau_healths = []
    bau_executions = []
    for activity in bau_activities:
        health = calculate_bau_health(db, activity.id)
        execution = calculate_bau_execution(db, activity.id)
        metrics_data = [
            {
                "id": m.id,
                "bau_activity_id": m.bau_activity_id,
                "name": m.name,
                "target_value": float(m.target_value),
                "current_value": float(m.current_value) if m.current_value else 0.0,
                "unit": m.unit,
                "weight": float(m.weight),
                "is_higher_better": m.is_higher_better,
                "created_at": m.created_at,
                "updated_at": m.updated_at
            }
            for m in activity.metrics
        ]
        bau_healths.append({
            "activity_id": activity.id,
            "activity_name": activity.name,
            "health": health,
            "execution": execution,
            "metrics": metrics_data
        })
        bau_executions.append(execution)
    
    avg_bau_health = (
        sum(b["health"] for b in bau_healths) / len(bau_healths)
        if bau_healths else 0.0
    )
    
    avg_bau_execution = (
        sum(bau_executions) / len(bau_executions)
        if bau_executions else 0.0
    )
    
    # Get current week priorities
    current_week = get_current_week()
    
    priorities = db.query(WeeklyPriority).filter(
        WeeklyPriority.week == current_week
    ).join(WorkItem).filter(
        WorkItem.team_id == team_id
    ).all()
    
    current_priorities = []
    for p in priorities:
        progress = calculate_work_item_progress(db, p.work_item_id)
        current_priorities.append({
            "priority_id": p.id,
            "work_item_id": p.work_item_id,
            "work_item_name": p.work_item.name,
            "priority": p.priority,
            "progress": progress
        })
    
    return {
        "team_id": team_id,
        "okr_progress": okr_progress,
        "bau_health": round(avg_bau_health, 2),
        "bau_execution": round(avg_bau_execution, 2),
        "okrs": okrs_data,
        "bau_activities": bau_healths,
        "current_week_priorities": current_priorities,
        "updated_at": datetime.utcnow()
    }


def get_department_dashboard(db: Session, department_id: int) -> dict:
    """Get complete dashboard data for a department (director view)."""
    # Get all teams in department
    teams = db.query(Team).filter(
        Team.department_id == department_id
    ).all()
    
    total_teams = len(teams)
    total_members = 0
    total_okr_progress = 0.0
    total_bau_health = 0.0
    team_count_with_data = 0
    
    teams_data = []
    
    for team in teams:
        # Get team members
        members = db.query(User).filter(
            User.team_id == team.id
        ).all()
        total_members += len(members)
        
        # Get team dashboard metrics
        team_dashboard = get_team_dashboard(db, team.id)
        
        if team_dashboard["okr_progress"] > 0 or team_dashboard["bau_health"] > 0:
            team_count_with_data += 1
            total_okr_progress += team_dashboard["okr_progress"]
            total_bau_health += team_dashboard["bau_health"]
        
        teams_data.append({
            "team_id": team.id,
            "team_name": team.name,
            "members_count": len(members),
            "okr_progress": team_dashboard["okr_progress"],
            "bau_health": team_dashboard["bau_health"]
        })
    
    avg_okr_progress = (
        total_okr_progress / team_count_with_data
        if team_count_with_data > 0 else 0.0
    )
    avg_bau_health = (
        total_bau_health / team_count_with_data
        if team_count_with_data > 0 else 0.0
    )
    
    return {
        "department_id": department_id,
        "total_teams": total_teams,
        "total_members": total_members,
        "average_okr_progress": round(avg_okr_progress, 2),
        "average_bau_health": round(avg_bau_health, 2),
        "teams": teams_data,
        "updated_at": datetime.utcnow()
    }


def get_organization_dashboard(db: Session) -> dict:
    """Get complete dashboard data for the organization (executive view)."""
    # Get all departments
    departments = db.query(Department).all()
    
    total_departments = len(departments)
    total_teams = 0
    total_members = 0
    total_directors = 0
    total_okr_progress = 0.0
    total_bau_health = 0.0
    dept_count_with_data = 0
    
    departments_data = []
    
    for dept in departments:
        # Count directors
        if dept.director_id:
            total_directors += 1
        
        # Get department dashboard
        dept_dashboard = get_department_dashboard(db, dept.id)
        
        total_teams += dept_dashboard["total_teams"]
        total_members += dept_dashboard["total_members"]
        
        if dept_dashboard["average_okr_progress"] > 0 or dept_dashboard["average_bau_health"] > 0:
            dept_count_with_data += 1
            total_okr_progress += dept_dashboard["average_okr_progress"]
            total_bau_health += dept_dashboard["average_bau_health"]
        
        # Get director name if director_id exists
        director_name = None
        if dept.director_id:
            director = db.query(User).filter(User.id == dept.director_id).first()
            if director:
                director_name = director.name
        
        departments_data.append({
            "department_id": dept.id,
            "department_name": dept.name,
            "director_name": director_name,
            "teams_count": dept_dashboard["total_teams"],
            "members_count": dept_dashboard["total_members"],
            "okr_progress": dept_dashboard["average_okr_progress"],
            "bau_health": dept_dashboard["average_bau_health"]
        })
    
    avg_okr_progress = (
        total_okr_progress / dept_count_with_data
        if dept_count_with_data > 0 else 0.0
    )
    avg_bau_health = (
        total_bau_health / dept_count_with_data
        if dept_count_with_data > 0 else 0.0
    )
    
    return {
        "total_departments": total_departments,
        "total_teams": total_teams,
        "total_members": total_members,
        "total_directors": total_directors,
        "average_okr_progress": round(avg_okr_progress, 2),
        "average_bau_health": round(avg_bau_health, 2),
        "departments": departments_data,
        "updated_at": datetime.utcnow()
    }

