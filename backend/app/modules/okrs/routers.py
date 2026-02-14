"""OKR management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from decimal import Decimal
from app.core.database import get_db
from app.models import OKR, KeyResult, Team
from app.modules.okrs.schemas import *
from app.modules.okrs.services import (
    get_okr_with_scores,
    validate_kr_weights,
    update_kr_current_value
)
from app.api.v1.deps import get_current_user, get_current_team_lead
from app.modules.users.models import User

router = APIRouter(prefix="/api/okrs", tags=["okrs"])


def normalize_okr(okr: OKR) -> OKR:
    """Ensure OKR has all required fields for backward compatibility."""
    # If new fields are missing, populate them from the legacy quarter field
    if okr.quarter and (not okr.year or not okr.quarters or not okr.okr_level):
        parts = okr.quarter.split(' ')
        if len(parts) == 2:
            quarter_part = parts[0]  # e.g., "Q1"
            year_part = int(parts[1])  # e.g., 2026
            
            if not okr.year:
                okr.year = year_part
            if not okr.quarters:
                okr.quarters = quarter_part
            if not okr.okr_level:
                okr.okr_level = "strategic"
    
    # Ensure defaults if still missing
    if not okr.year:
        okr.year = 2026
    if not okr.quarters:
        okr.quarters = "Q1"
    if not okr.okr_level:
        okr.okr_level = "strategic"
    
    return okr


@router.post("/add", response_model=OKRResponse, status_code=status.HTTP_201_CREATED)
def add_okr(
    okr_data: OKRCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """
    Create a new OKR with initial key results.
    This is the main endpoint for creating OKRs with full details.
    """
    if not current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must be assigned to a team"
        )
    
    team_id = current_user.team_id
    
    # Check team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Store quarters as single value
    quarters_str = okr_data.quarter
    
    # Create legacy quarter field for backward compatibility
    legacy_quarter = f"{okr_data.quarter} {okr_data.year}"
    
    # Create OKR
    new_okr = OKR(
        team_id=team_id,
        year=okr_data.year,
        quarters=quarters_str,
        okr_level=okr_data.okr_level,
        objective=okr_data.objective,
        description=okr_data.description,
        status=okr_data.status or "draft",
        quarter=legacy_quarter  # For backward compatibility
    )
    
    db.add(new_okr)
    db.flush()  # Get the OKR ID without committing
    
    # Add key results if provided - current_value defaults to base_value
    if okr_data.key_results:
        for kr_data in okr_data.key_results:
            new_kr = KeyResult(
                okr_id=new_okr.id,
                description=kr_data.description,
                base_value=kr_data.base_value,
                target_value=kr_data.target_value,
                current_value=kr_data.base_value,  # Default to base_value
                unit=kr_data.unit,
                weight=kr_data.weight
            )
            db.add(new_kr)
    
    db.commit()
    db.refresh(new_okr)
    
    return new_okr


@router.post("/teams/{team_id}/okrs", response_model=OKRResponse, status_code=status.HTTP_201_CREATED)
def create_okr(
    team_id: int,
    okr_data: OKRCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Create a new OKR for a team (legacy endpoint for backward compatibility)."""
    # Check team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Store quarter as single value
    quarters_str = okr_data.quarter
    
    # Create legacy quarter field for backward compatibility
    legacy_quarter = f"{okr_data.quarter} {okr_data.year}"
    
    new_okr = OKR(
        team_id=team_id,
        year=okr_data.year,
        quarters=quarters_str,
        okr_level=okr_data.okr_level,
        objective=okr_data.objective,
        description=okr_data.description,
        status=okr_data.status or "draft",
        quarter=legacy_quarter
    )
    
    db.add(new_okr)
    db.flush()
    
    # Add key results if provided
    if okr_data.key_results:
        for kr_data in okr_data.key_results:
            new_kr = KeyResult(
                okr_id=new_okr.id,
                description=kr_data.description,
                base_value=kr_data.base_value,
                target_value=kr_data.target_value,
                current_value=kr_data.base_value,  # Initialize with base value
                unit=kr_data.unit,
                weight=kr_data.weight
            )
            db.add(new_kr)
    
    db.commit()
    db.refresh(new_okr)
    
    return new_okr


@router.get("/teams/{team_id}/okrs", response_model=List[OKRDetailResponse])
def list_team_okrs(
    team_id: int,
    quarter: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List team OKRs with key results and optional quarter filter."""
    # Check team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    query = db.query(OKR).options(joinedload(OKR.key_results)).filter(OKR.team_id == team_id)

    if quarter:
        query = query.filter(OKR.quarter == quarter)

    okrs = query.all()
    
    # Normalize OKRs to ensure backward compatibility
    normalized_okrs = [normalize_okr(okr) for okr in okrs]
    
    return normalized_okrs


@router.get("/{okr_id}", response_model=OKRDetailResponse)
def get_okr(
    okr_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get OKR details with key results."""
    okr = db.query(OKR).options(joinedload(OKR.key_results)).filter(OKR.id == okr_id).first()
    
    if not okr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OKR not found"
        )
    
    # Normalize for backward compatibility
    okr = normalize_okr(okr)
    
    return okr


@router.get("/{okr_id}/with-scores", response_model=OKRWithScoreResponse)
def get_okr_with_calculated_scores(
    okr_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get OKR with calculated scores for all key results and objective."""
    okr_data = get_okr_with_scores(db, okr_id)
    
    if not okr_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OKR not found"
        )
    
    return okr_data


@router.put("/{okr_id}", response_model=OKRResponse)
def update_okr(
    okr_id: int,
    okr_data: OKRUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Update an OKR."""
    okr = db.query(OKR).filter(OKR.id == okr_id).first()
    
    if not okr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OKR not found"
        )
    
    if okr_data.year is not None:
        okr.year = okr_data.year
        # Update legacy quarter field if we have quarters
        if okr.quarters:
            okr.quarter = f"{okr.quarters} {okr_data.year}"
    
    if okr_data.quarter is not None:
        okr.quarters = okr_data.quarter
        # Update legacy quarter field
        okr.quarter = f"{okr_data.quarter} {okr.year}"
    
    if okr_data.okr_level is not None:
        okr.okr_level = okr_data.okr_level

    if okr_data.objective is not None:
        okr.objective = okr_data.objective
    
    if okr_data.description is not None:
        okr.description = okr_data.description
    
    if okr_data.status is not None:
        okr.status = okr_data.status

    if okr_data.is_active is not None:
        okr.is_active = okr_data.is_active
    
    db.commit()
    db.refresh(okr)
    
    return okr


@router.delete("/{okr_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_okr(
    okr_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Delete an OKR and all its key results."""
    okr = db.query(OKR).filter(OKR.id == okr_id).first()

    if not okr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OKR not found"
        )

    db.delete(okr)
    db.commit()


@router.post("/{okr_id}/key-results", response_model=KeyResultResponse, status_code=status.HTTP_201_CREATED)
def create_key_result(
    okr_id: int,
    kr_data: KeyResultCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Add a key result to an OKR."""
    okr = db.query(OKR).filter(OKR.id == okr_id).first()
    
    if not okr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OKR not found"
        )
    
    # Validate that weights will sum to 1.0 after adding this KR
    existing_krs = db.query(KeyResult).filter(KeyResult.okr_id == okr_id).all()
    total_weight = sum(float(kr.weight) for kr in existing_krs) + float(kr_data.weight)
    
    if abs(total_weight - 1.0) > 0.01:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Key Result weights must sum to 1.0 (will be {total_weight:.3f} with this addition)"
        )
    
    new_kr = KeyResult(
        okr_id=okr_id,
        description=kr_data.description,
        base_value=kr_data.base_value,
        target_value=kr_data.target_value,
        current_value=kr_data.current_value if kr_data.current_value is not None else kr_data.base_value,
        unit=kr_data.unit,
        weight=kr_data.weight
    )
    
    db.add(new_kr)
    db.commit()
    db.refresh(new_kr)
    
    return new_kr


@router.put("/key-results/{kr_id}", response_model=KeyResultResponse)
def update_key_result(
    kr_id: int,
    kr_data: KeyResultUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Update a key result."""
    kr = db.query(KeyResult).filter(KeyResult.id == kr_id).first()

    if not kr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Key result not found"
        )

    # If weight is being updated, validate total weights
    if kr_data.weight is not None and kr_data.weight != kr.weight:
        existing_krs = db.query(KeyResult).filter(
            KeyResult.okr_id == kr.okr_id,
            KeyResult.id != kr_id
        ).all()
        total_weight = sum(float(existing_kr.weight) for existing_kr in existing_krs) + float(kr_data.weight)
        
        if abs(total_weight - 1.0) > 0.01:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Key Result weights must sum to 1.0 (will be {total_weight:.3f} with this update)"
            )

    if kr_data.description is not None:
        kr.description = kr_data.description

    if kr_data.base_value is not None:
        kr.base_value = kr_data.base_value

    if kr_data.target_value is not None:
        kr.target_value = kr_data.target_value

    if kr_data.unit is not None:
        kr.unit = kr_data.unit

    if kr_data.current_value is not None:
        kr.current_value = kr_data.current_value

    if kr_data.weight is not None:
        kr.weight = kr_data.weight

    db.commit()
    db.refresh(kr)

    return kr


@router.patch("/key-results/{kr_id}/current-value")
def update_kr_current(
    kr_id: int,
    current_value: Decimal,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Update only the current value of a Key Result (weekly update by Manager)."""
    kr = update_kr_current_value(db, kr_id, current_value)
    
    if not kr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Key result not found"
        )
    
    return {
        "id": kr.id,
        "current_value": kr.current_value,
        "message": "Current value updated successfully"
    }


@router.delete("/key-results/{kr_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_key_result(
    kr_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Delete a key result."""
    kr = db.query(KeyResult).filter(KeyResult.id == kr_id).first()

    if not kr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Key result not found"
        )

    # Validate remaining weights will be valid
    okr_id = kr.okr_id
    db.delete(kr)
    db.flush()  # Apply delete but don't commit yet
    
    is_valid, error_msg = validate_kr_weights(db, okr_id)
    if not is_valid and error_msg:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete: {error_msg}"
        )
    
    db.commit()
