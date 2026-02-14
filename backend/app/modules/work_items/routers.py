"""Work items and tasks endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models import *
from app.schemas import *
from app.api.v1.deps import get_current_user, get_current_team_lead
from app.modules.work_items.services import calculate_work_item_progress

router = APIRouter(prefix="/api", tags=["work-items", "tasks"])


@router.post("/work-items", response_model=WorkItemResponse, status_code=status.HTTP_201_CREATED)
def create_work_item(
    work_item_data: WorkItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Create a new work item."""
    # Verify source exists (OKR or BAU)
    if work_item_data.source_type == "OKR":
        source = db.query(KeyResult).filter(KeyResult.id == work_item_data.source_id).first()
    else:  # BAU
        source = db.query(BAUActivity).filter(BAUActivity.id == work_item_data.source_id).first()
    
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{work_item_data.source_type} source not found"
        )
    
    new_work_item = WorkItem(
        team_id=work_item_data.team_id if hasattr(work_item_data, 'team_id') else current_user.team_id,
        title=work_item_data.title,
        description=work_item_data.description,
        source_type=work_item_data.source_type,
        source_id=work_item_data.source_id,
        owner_id=work_item_data.owner_id,
        month=work_item_data.month,
        status="Not Started"
    )
    
    db.add(new_work_item)
    db.commit()
    db.refresh(new_work_item)
    
    return new_work_item


@router.get("/work-items", response_model=list[WorkItemResponse])
def list_work_items(
    team_id: int = Query(None),
    month: str = Query(None),
    source_type: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List work items with optional filters."""
    query = db.query(WorkItem)
    
    if team_id:
        query = query.filter(WorkItem.team_id == team_id)
    
    if month:
        query = query.filter(WorkItem.month == month)
    
    if source_type:
        query = query.filter(WorkItem.source_type == source_type)
    
    work_items = query.all()
    return work_items


@router.get("/work-items-with-source", response_model=list[WorkItemWithSourceResponse])
def list_work_items_with_source(
    team_id: int = Query(None),
    month: str = Query(None),
    source_type: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List work items with related OKR Key Results or BAU Activities data."""
    query = db.query(WorkItem)
    
    if team_id:
        query = query.filter(WorkItem.team_id == team_id)
    
    if month:
        query = query.filter(WorkItem.month == month)
    
    if source_type:
        query = query.filter(WorkItem.source_type == source_type)
    
    work_items = query.all()
    
    # Manually load related source data
    result = []
    for wi in work_items:
        wi_dict = {
            'id': wi.id,
            'team_id': wi.team_id,
            'title': wi.title,
            'description': wi.description,
            'source_type': wi.source_type,
            'source_id': wi.source_id,
            'owner_id': wi.owner_id,
            'month': wi.month,
            'status': wi.status,
            'created_at': wi.created_at,
            'updated_at': wi.updated_at,
            'key_result': None,
            'bau_activity': None,
        }
        
        # Load the related source
        if wi.source_type == 'OKR':
            kr = db.query(KeyResult).filter(KeyResult.id == wi.source_id).first()
            if kr:
                wi_dict['key_result'] = {
                    'id': kr.id,
                    'okr_id': kr.okr_id,
                    'description': kr.description,
                    'base_value': kr.base_value,
                    'target_value': kr.target_value,
                    'current_value': kr.current_value,
                    'unit': kr.unit,
                    'weight': kr.weight,
                    'created_at': kr.created_at,
                    'updated_at': kr.updated_at,
                }
        else:  # BAU
            bau = db.query(BAUActivity).filter(BAUActivity.id == wi.source_id).first()
            if bau:
                wi_dict['bau_activity'] = {
                    'id': bau.id,
                    'team_id': bau.team_id,
                    'name': bau.name,
                    'description': bau.description,
                    'is_active': bau.is_active,
                    'created_at': bau.created_at,
                    'updated_at': bau.updated_at,
                }
        
        result.append(wi_dict)
    
    return result


@router.get("/work-items/{work_item_id}", response_model=WorkItemDetailResponse)
def get_work_item(
    work_item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get work item details with tasks."""
    work_item = db.query(WorkItem).filter(WorkItem.id == work_item_id).first()
    
    if not work_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work item not found"
        )
    
    return work_item


@router.put("/work-items/{work_item_id}", response_model=WorkItemResponse)
def update_work_item(
    work_item_id: int,
    work_item_data: WorkItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Update a work item."""
    work_item = db.query(WorkItem).filter(WorkItem.id == work_item_id).first()
    
    if not work_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work item not found"
        )
    
    if work_item_data.title is not None:
        work_item.title = work_item_data.title
    
    if work_item_data.description is not None:
        work_item.description = work_item_data.description
    
    if work_item_data.owner_id is not None:
        work_item.owner_id = work_item_data.owner_id
    
    if work_item_data.status is not None:
        work_item.status = work_item_data.status
    
    db.commit()
    db.refresh(work_item)
    
    return work_item


@router.delete("/work-items/{work_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_item(
    work_item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Delete a work item and its associated tasks and priorities."""
    work_item = db.query(WorkItem).filter(WorkItem.id == work_item_id).first()
    if not work_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work item not found"
        )
    
    db.delete(work_item)
    db.commit()
