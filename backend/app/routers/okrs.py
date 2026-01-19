"""OKR management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app import models, schemas
from app.utils.dependencies import get_current_user, get_current_team_lead
from app.calculations import calculate_okr_progress, calculate_kr_progress

router = APIRouter(prefix="/api/okrs", tags=["okrs"])


@router.post("/teams/{team_id}/okrs", response_model=schemas.OKRResponse, status_code=status.HTTP_201_CREATED)
def create_okr(
    team_id: int,
    okr_data: schemas.OKRCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_team_lead)
):
    """Create a new OKR for a team."""
    # Check team exists
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if OKR already exists for this quarter
    existing_okr = db.query(models.OKR).filter(
        models.OKR.team_id == team_id,
        models.OKR.quarter == okr_data.quarter
    ).first()
    
    if existing_okr:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OKR already exists for {okr_data.quarter}"
        )
    
    new_okr = models.OKR(
        team_id=team_id,
        quarter=okr_data.quarter,
        objective=okr_data.objective
    )
    
    db.add(new_okr)
    db.commit()
    db.refresh(new_okr)
    
    return new_okr


@router.get("/teams/{team_id}/okrs", response_model=list[schemas.OKRResponse])
def list_team_okrs(
    team_id: int,
    quarter: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List team OKRs with optional quarter filter."""
    # Check team exists
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    query = db.query(models.OKR).filter(models.OKR.team_id == team_id)
    
    if quarter:
        query = query.filter(models.OKR.quarter == quarter)
    
    okrs = query.all()
    return okrs


@router.get("/{okr_id}", response_model=schemas.OKRDetailResponse)
def get_okr(
    okr_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get OKR details with key results."""
    okr = db.query(models.OKR).options(joinedload(models.OKR.key_results)).filter(models.OKR.id == okr_id).first()
    
    if not okr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OKR not found"
        )
    
    return okr


@router.put("/{okr_id}", response_model=schemas.OKRResponse)
def update_okr(
    okr_id: int,
    okr_data: schemas.OKRUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_team_lead)
):
    """Update an OKR."""
    okr = db.query(models.OKR).filter(models.OKR.id == okr_id).first()
    
    if not okr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OKR not found"
        )
    
    if okr_data.objective is not None:
        okr.objective = okr_data.objective
    
    if okr_data.is_active is not None:
        okr.is_active = okr_data.is_active
    
    db.commit()
    db.refresh(okr)
    
    return okr


@router.delete("/{okr_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_okr(
    okr_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_team_lead)
):
    """Archive (soft delete) an OKR."""
    okr = db.query(models.OKR).filter(models.OKR.id == okr_id).first()
    
    if not okr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OKR not found"
        )
    
    okr.is_active = False
    db.commit()


@router.post("/{okr_id}/key-results", response_model=schemas.KeyResultResponse, status_code=status.HTTP_201_CREATED)
def create_key_result(
    okr_id: int,
    kr_data: schemas.KeyResultCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_team_lead)
):
    """Add a key result to an OKR."""
    okr = db.query(models.OKR).filter(models.OKR.id == okr_id).first()
    
    if not okr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OKR not found"
        )
    
    new_kr = models.KeyResult(
        okr_id=okr_id,
        description=kr_data.description,
        target_value=kr_data.target_value,
        unit=kr_data.unit
    )
    
    db.add(new_kr)
    db.commit()
    db.refresh(new_kr)
    
    return new_kr


@router.put("/key-results/{kr_id}", response_model=schemas.KeyResultResponse)
def update_key_result(
    kr_id: int,
    kr_data: schemas.KeyResultUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_team_lead)
):
    """Update a key result."""
    kr = db.query(models.KeyResult).filter(models.KeyResult.id == kr_id).first()
    
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


@router.get("/{kr_id}/progress", response_model=schemas.KRProgressResponse)
def get_kr_progress(
    kr_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get key result progress."""
    kr = db.query(models.KeyResult).filter(models.KeyResult.id == kr_id).first()
    
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


@router.get("/{okr_id}/progress", response_model=schemas.OKRProgressResponse)
def get_okr_progress(
    okr_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get OKR progress with all key results."""
    okr = db.query(models.OKR).filter(models.OKR.id == okr_id).first()
    
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

