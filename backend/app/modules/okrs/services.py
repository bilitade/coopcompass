"""OKR service logic."""

from sqlalchemy.orm import Session
from decimal import Decimal
from app.models import OKR, KeyResult, WorkItem
from app.modules.work_items.services import calculate_work_item_progress


def calculate_kr_progress(db: Session, kr_id: int) -> float:
    """Calculate Key Result progress from related work items."""
    work_items = db.query(WorkItem).filter(
        WorkItem.source_type == "OKR",
        WorkItem.source_id == kr_id
    ).all()
    
    if not work_items:
        return 0.0
    
    total_progress = sum(
        calculate_work_item_progress(db, wi.id) for wi in work_items
    )
    
    avg_progress = total_progress / len(work_items)
    
    # Update KR current_value based on progress
    kr = db.query(KeyResult).filter(KeyResult.id == kr_id).first()
    if kr and kr.target_value:
        kr.current_value = Decimal(str((avg_progress / 100) * float(kr.target_value)))
        db.commit()
    
    return round(avg_progress, 2)


def calculate_okr_progress(db: Session, okr_id: int) -> float:
    """Calculate overall OKR progress from all key results."""
    key_results = db.query(KeyResult).filter(
        KeyResult.okr_id == okr_id
    ).all()
    
    if not key_results:
        return 0.0
    
    kr_progresses = [calculate_kr_progress(db, kr.id) for kr in key_results]
    avg_progress = sum(kr_progresses) / len(kr_progresses)
    
    return round(avg_progress, 2)

