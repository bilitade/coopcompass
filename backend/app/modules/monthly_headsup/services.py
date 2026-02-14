"""Monthly Heads-Up services."""

from sqlalchemy.orm import Session
from typing import List, Optional
from .models import MonthlyHeadsUp
from .schemas import MonthlyHeadsUpCreate, MonthlyHeadsUpUpdate


def get_monthly_headsups(db: Session, team_id: int) -> List[MonthlyHeadsUp]:
    """Get all monthly headsups for a team."""
    return db.query(MonthlyHeadsUp).filter(MonthlyHeadsUp.team_id == team_id).order_by(MonthlyHeadsUp.month.desc()).all()


def get_monthly_headsup(db: Session, headsup_id: int) -> Optional[MonthlyHeadsUp]:
    """Get a monthly headsup by ID."""
    return db.query(MonthlyHeadsUp).filter(MonthlyHeadsUp.id == headsup_id).first()


def get_monthly_headsup_by_month(db: Session, team_id: int, month: str) -> Optional[MonthlyHeadsUp]:
    """Get a monthly headsup by team and month."""
    return db.query(MonthlyHeadsUp).filter(
        MonthlyHeadsUp.team_id == team_id,
        MonthlyHeadsUp.month == month
    ).first()


def create_monthly_headsup(db: Session, team_id: int, obj_in: MonthlyHeadsUpCreate) -> MonthlyHeadsUp:
    """Create a new monthly headsup."""
    db_obj = MonthlyHeadsUp(
        team_id=team_id,
        month=obj_in.month,
        description=obj_in.description
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_monthly_headsup(db: Session, db_obj: MonthlyHeadsUp, obj_in: MonthlyHeadsUpUpdate) -> MonthlyHeadsUp:
    """Update a monthly headsup."""
    if obj_in.description is not None:
        db_obj.description = obj_in.description
    
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_monthly_headsup(db: Session, headsup_id: int) -> bool:
    """Delete a monthly headsup."""
    db_obj = get_monthly_headsup(db, headsup_id)
    if db_obj:
        db.delete(db_obj)
        db.commit()
        return True
    return False
