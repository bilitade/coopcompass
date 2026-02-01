"""OKR management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models import *
from app.schemas import *
from app.api.v1.deps import get_current_user, get_current_team_lead
from app.modules.okrs.services import calculate_okr_progress, calculate_kr_progress

router = APIRouter(prefix="/api/okrs", tags=["okrs"])


@router.post("/teams/{team_id}/okrs", response_model=OKRResponse, status_code=status.HTTP_201_CREATED)
def create_okr(
    team_id: int,
    okr_data: OKRCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Create a new OKR for a team."""
    # Check team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if OKR already exists for this quarter
    existing_okr = db.query(OKR).filter(
        OKR.team_id == team_id,
        OKR.quarter == okr_data.quarter
    ).first()
    
    if existing_okr:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OKR already exists for {okr_data.quarter}"
        )
    
    new_okr = OKR(
        team_id=team_id,
        quarter=okr_data.quarter,
        objective=okr_data.objective
    )
    
    db.add(new_okr)
    db.commit()
    db.refresh(new_okr)
    
    return new_okr


@router.get("/teams/{team_id}/okrs", response_model=list[OKRDetailResponse])
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
    return okrs


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
    
    return okr


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
    
    if okr_data.quarter is not None:
        okr.quarter = okr_data.quarter

    if okr_data.objective is not None:
        okr.objective = okr_data.objective

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
    
    new_kr = KeyResult(
        okr_id=okr_id,
        description=kr_data.description,
        target_value=kr_data.target_value,
        unit=kr_data.unit
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

    if kr_data.description is not None:
        kr.description = kr_data.description

    if kr_data.target_value is not None:
        kr.target_value = kr_data.target_value

    if kr_data.unit is not None:
        kr.unit = kr_data.unit

    if kr_data.current_value is not None:
        kr.current_value = kr_data.current_value

    db.commit()
    db.refresh(kr)

    return kr


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

    db.delete(kr)
    db.commit()


@router.get("/{kr_id}/progress", response_model=KRProgressResponse)
def get_kr_progress(
    kr_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get key result progress."""
    kr = db.query(KeyResult).filter(KeyResult.id == kr_id).first()
    
    if not kr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Key result not found"
        )
    
    progress = calculate_kr_progress(db, kr_id)
    
    return {
        "kr_id": kr.id,
        "description": kr.description,
        "progress": progress,
        "current_value": kr.current_value,
        "target_value": kr.target_value
    }


@router.get("/{okr_id}/progress", response_model=OKRProgressResponse)
def get_okr_progress(
    okr_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get OKR progress with all key results."""
    okr = db.query(OKR).filter(OKR.id == okr_id).first()
    
    if not okr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OKR not found"
        )
    
    progress = calculate_okr_progress(db, okr_id)
    
    kr_progresses = []
    for kr in okr.key_results:
        kr_progress = calculate_kr_progress(db, kr.id)
        kr_progresses.append({
            "kr_id": kr.id,
            "description": kr.description,
            "progress": kr_progress,
            "current_value": kr.current_value,
            "target_value": kr.target_value
        })
    
    return {
        "okr_id": okr.id,
        "objective": okr.objective,
        "quarter": okr.quarter,
        "progress": progress,
        "key_results": kr_progresses
    }

