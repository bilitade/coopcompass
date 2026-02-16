"""Weekly Priority service logic."""

from sqlalchemy.orm import Session
from datetime import datetime
from app.models import OKR, Team, Department, User, WeeklyPriority, WeeklyPriorityPlan, WorkItem
from app.services.calculations import get_current_quarter, get_current_week
from app.modules.okrs.services import calculate_okr_progress, calculate_kr_progress
from app.modules.bau.services import calculate_bau_health, get_bau_activity_with_scores
from app.modules.work_items.services import calculate_work_item_progress


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
    for activity in bau_activities:
        activity_data = get_bau_activity_with_scores(db, activity.id)
        if activity_data:
            bau_healths.append({
                "activity_id": activity_data["id"],
                "activity_name": activity_data["name"],
                "health": activity_data["activity_score"],
                "id": activity_data["id"],
                "name": activity_data["name"],
                "activity_score": activity_data["activity_score"],
                "metrics": activity_data["metrics"]
            })
    
    avg_bau_health = (
        sum(b["activity_score"] for b in bau_healths) / len(bau_healths)
        if bau_healths else 0.0
    )
    
    # Get current week priorities
    current_week = get_current_week()
    
    # Find the plan for this week
    plan = db.query(WeeklyPriorityPlan).join(WeeklyPriorityPlan.monthly_headsup).filter(
        WeeklyPriorityPlan.week == current_week,
        WeeklyPriorityPlan.monthly_headsup.has(team_id=team_id)
    ).first()
    
    current_priorities = []
    if plan:
        for p in plan.priorities:
            progress = calculate_work_item_progress(db, p.work_item_id)
            current_priorities.append({
                "priority_id": p.id,
                "work_item_id": p.work_item_id,
                "work_item_name": p.work_item.title,
                "priority": p.priority,
                "progress": progress
            })
    
    # Get all active OKRs for the year (to support timeline)
    all_okrs = db.query(OKR).filter(
        OKR.team_id == team_id,
        OKR.is_active == True
    ).order_by(OKR.quarter).all()
    
    all_okrs_data = []
    for o in all_okrs:
        all_okrs_data.append({
            "id": o.id,
            "objective": o.objective,
            "quarter": o.quarter,
            "status": o.status,
            "okr_level": o.okr_level,
            "progress": calculate_okr_progress(db, o.id)
        })

    # Get Monthly Heads-Up for current month
    from app.modules.monthly_headsup.models import MonthlyHeadsUp
    current_month = datetime.now().strftime("%Y-%m")
    headsup = db.query(MonthlyHeadsUp).filter(
        MonthlyHeadsUp.team_id == team_id,
        MonthlyHeadsUp.month == current_month
    ).first()

    return {
        "team_id": team_id,
        "okr_progress": okr_progress,
        "bau_health": round(avg_bau_health, 2),
        "okrs": okrs_data,
        "all_okrs": all_okrs_data,
        "monthly_headsup": {
            "id": headsup.id,
            "description": headsup.description,
            "month": headsup.month,
            "work_items": [
                {
                    "id": wi.id,
                    "title": wi.title,
                    "status": wi.status,
                    "progress": calculate_work_item_progress(db, wi.id)
                }
                for wi in headsup.work_items[:5]
            ]
        } if headsup else None,
        "bau_activities": bau_healths,
        "current_week_priorities": current_priorities,
        "weekly_plan": {
            "id": plan.id,
            "week_focus": plan.week_focus
        } if plan else None,
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
    teams_with_okrs = 0
    teams_with_bau = 0
    
    teams_data = []
    
    for team in teams:
        # Get team members
        members = db.query(User).filter(
            User.team_id == team.id
        ).all()
        total_members += len(members)
        
        # Get team dashboard metrics
        team_dashboard = get_team_dashboard(db, team.id)
        
        # Calculate OKR progress from all active OKRs, not just current quarter
        all_okrs = team_dashboard.get("all_okrs", [])
        if all_okrs:
            # Calculate average progress from all active OKRs
            avg_okr_progress = sum(okr["progress"] for okr in all_okrs) / len(all_okrs)
            teams_with_okrs += 1
            total_okr_progress += avg_okr_progress
            team_okr_progress = avg_okr_progress
        else:
            team_okr_progress = 0.0
            
        # Count BAU health if it exists (non-zero) or if the team has BAU activities
        if len(team_dashboard["bau_activities"]) > 0 or team_dashboard["bau_health"] > 0:
            teams_with_bau += 1
            total_bau_health += team_dashboard["bau_health"]
        
        teams_data.append({
            "team_id": team.id,
            "team_name": team.name,
            "members_count": len(members),
            "okr_progress": team_okr_progress,
            "bau_health": team_dashboard["bau_health"]
        })
    
    avg_okr_progress = (
        total_okr_progress / teams_with_okrs
        if teams_with_okrs > 0 else 0.0
    )
    avg_bau_health = (
        total_bau_health / teams_with_bau
        if teams_with_bau > 0 else 0.0
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
    depts_with_okrs = 0
    depts_with_bau = 0
    
    departments_data = []
    
    for dept in departments:
        # Count directors
        if dept.director_id:
            total_directors += 1
        
        # Get department dashboard
        dept_dashboard = get_department_dashboard(db, dept.id)
        
        total_teams += dept_dashboard["total_teams"]
        total_members += dept_dashboard["total_members"]
        
        if dept_dashboard["average_okr_progress"] > 0:
            depts_with_okrs += 1
            total_okr_progress += dept_dashboard["average_okr_progress"]
            
        if dept_dashboard["average_bau_health"] > 0:
            depts_with_bau += 1
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
        total_okr_progress / depts_with_okrs
        if depts_with_okrs > 0 else 0.0
    )
    avg_bau_health = (
        total_bau_health / depts_with_bau
        if depts_with_bau > 0 else 0.0
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


def get_weekly_priority_plan(db: Session, plan_id: int):
    """Get a weekly priority plan by ID."""
    return db.query(WeeklyPriorityPlan).filter(WeeklyPriorityPlan.id == plan_id).first()


def get_weekly_priority_plan_by_week(db: Session, headsup_id: int, week: str):
    """Get a weekly priority plan by headsup ID and week."""
    return db.query(WeeklyPriorityPlan).filter(
        WeeklyPriorityPlan.monthly_headsup_id == headsup_id,
        WeeklyPriorityPlan.week == week
    ).first()


def create_weekly_priority_plan(db: Session, obj_in):
    """Create a new weekly priority plan."""
    db_obj = WeeklyPriorityPlan(
        monthly_headsup_id=obj_in.monthly_headsup_id,
        week=obj_in.week,
        week_focus=obj_in.week_focus
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_weekly_priority_plan(db: Session, db_obj: WeeklyPriorityPlan, obj_in):
    """Update a weekly priority plan."""
    if hasattr(obj_in, 'week_focus'):
        db_obj.week_focus = obj_in.week_focus
    db.commit()
    db.refresh(db_obj)
    return db_obj


def create_weekly_priority(db: Session, obj_in):
    """Create a new weekly priority."""
    # Validate P1 count
    if obj_in.priority == 1:
        p1_count = db.query(WeeklyPriority).filter(
            WeeklyPriority.plan_id == obj_in.plan_id,
            WeeklyPriority.priority == 1
        ).count()
        if p1_count >= 3:
            raise ValueError("Maximum 3 P1 priorities allowed per week")
            
    db_obj = WeeklyPriority(
        plan_id=obj_in.plan_id,
        work_item_id=obj_in.work_item_id,
        priority=obj_in.priority
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_weekly_priorities(db: Session, plan_id: int):
    """Get all priorities for a plan."""
    return db.query(WeeklyPriority).filter(WeeklyPriority.plan_id == plan_id).all()


def update_weekly_priority(db: Session, priority_id: int, new_priority: int):
    """Update a priority level."""
    db_obj = db.query(WeeklyPriority).filter(WeeklyPriority.id == priority_id).first()
    if not db_obj:
        return None
        
    if new_priority == 1 and db_obj.priority != 1:
        p1_count = db.query(WeeklyPriority).filter(
            WeeklyPriority.plan_id == db_obj.plan_id,
            WeeklyPriority.priority == 1
        ).count()
        if p1_count >= 3:
            raise ValueError("Maximum 3 P1 priorities allowed per week")
            
    db_obj.priority = new_priority
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_weekly_priority(db: Session, priority_id: int):
    """Delete a weekly priority."""
    db_obj = db.query(WeeklyPriority).filter(WeeklyPriority.id == priority_id).first()
    if not db_obj:
        return False
    db.delete(db_obj)
    db.commit()
    return True


def delete_weekly_priority_plan(db: Session, plan_id: int):
    """Delete a weekly priority plan and its priorities (cascade)."""
    db_obj = db.query(WeeklyPriorityPlan).filter(WeeklyPriorityPlan.id == plan_id).first()
    if not db_obj:
        return False
    db.delete(db_obj)
    db.commit()
    return True


def get_current_priorities(db: Session, team_id: int):
    """Retrieve all work items with their priority level (P1, P2, P3) for a team in the current ISO week."""
    from app.services.calculations import get_current_week
    from app.modules.monthly_headsup.models import MonthlyHeadsUp
    
    current_week = get_current_week()
    
    # Find active plan for this week
    plan = db.query(WeeklyPriorityPlan).join(
        MonthlyHeadsUp, WeeklyPriorityPlan.monthly_headsup_id == MonthlyHeadsUp.id
    ).filter(
        MonthlyHeadsUp.team_id == team_id,
        WeeklyPriorityPlan.week == current_week
    ).first()
    
    if not plan:
        return []
        
    return db.query(WeeklyPriority).filter(WeeklyPriority.plan_id == plan.id).all()
