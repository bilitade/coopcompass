"""Monthly Heads-Up routers."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.v1 import deps
from . import services, schemas
from app.modules.users.models import User

router = APIRouter()


@router.get("/", response_model=List[schemas.MonthlyHeadsUpResponse])
def read_headsups(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get all monthly headsups for a team."""
    return services.get_monthly_headsups(db, team_id=team_id)


@router.post("/", response_model=schemas.MonthlyHeadsUpResponse, status_code=status.HTTP_201_CREATED)
def create_headsup(
    obj_in: schemas.MonthlyHeadsUpCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_team_lead)
):
    """Create a new monthly headsup."""
    # Check if headsup already exists for this month
    existing = services.get_monthly_headsup_by_month(db, team_id=current_user.team_id, month=obj_in.month)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Monthly Heads-Up already exists for {obj_in.month}"
        )
    return services.create_monthly_headsup(db, team_id=current_user.team_id, obj_in=obj_in)


@router.get("/{id}", response_model=schemas.MonthlyHeadsUpResponse)
def read_headsup(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get a monthly headsup by ID."""
    db_obj = services.get_monthly_headsup(db, headsup_id=id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Monthly Heads-Up not found")
    return db_obj


@router.put("/{id}", response_model=schemas.MonthlyHeadsUpResponse)
def update_headsup(
    id: int,
    obj_in: schemas.MonthlyHeadsUpUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_team_lead)
):
    """Update a monthly headsup."""
    db_obj = services.get_monthly_headsup(db, headsup_id=id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Monthly Heads-Up not found")
    return services.update_monthly_headsup(db, db_obj=db_obj, obj_in=obj_in)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_headsup(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_team_lead)
):
    """Delete a monthly headsup."""
    if not services.delete_monthly_headsup(db, headsup_id=id):
        raise HTTPException(status_code=404, detail="Monthly Heads-Up not found")
    return None
