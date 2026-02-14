"""OKR service logic."""

from sqlalchemy.orm import Session
from typing import Dict, List
from decimal import Decimal
from app.models import OKR, KeyResult
from app.services.calculations import (
    calculate_kr_score,
    calculate_objective_score,
    get_okr_status,
    validate_weights_sum_to_one
)


def get_okr_with_scores(db: Session, okr_id: int) -> Dict:
    """
    Get OKR with calculated scores for all key results and objective.
    
    Args:
        db: Database session
        okr_id: OKR ID
    
    Returns:
        Dictionary with OKR data and calculated scores
    """
    okr = db.query(OKR).filter(OKR.id == okr_id).first()
    
    if not okr:
        return None
    
    # Calculate scores for each key result
    kr_data = []
    for kr in okr.key_results:
        score = calculate_kr_score(kr.base_value, kr.target_value, kr.current_value)
        kr_data.append({
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
            'score': score
        })
    
    # Calculate objective score
    objective_score = calculate_objective_score([
        {'score': kr['score'], 'weight': kr['weight']}
        for kr in kr_data
    ])
    
    # Get status
    status = get_okr_status(objective_score)
    
    return {
        'id': okr.id,
        'team_id': okr.team_id,
        'quarter': okr.quarter,
        'objective': okr.objective,
        'is_active': okr.is_active,
        'created_at': okr.created_at,
        'updated_at': okr.updated_at,
        'key_results': kr_data,
        'objective_score': objective_score,
        'status': status
    }


def validate_kr_weights(db: Session, okr_id: int, exclude_kr_id: int = None) -> tuple[bool, str]:
    """
    Validate that all key result weights for an OKR sum to 1.0.
    
    Args:
        db: Database session
        okr_id: OKR ID
        exclude_kr_id: Optional KR ID to exclude (for updates/deletes)
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    query = db.query(KeyResult).filter(KeyResult.okr_id == okr_id)
    
    if exclude_kr_id:
        query = query.filter(KeyResult.id != exclude_kr_id)
    
    key_results = query.all()
    
    if not key_results:
        return True, ""  # No KRs yet
    
    weights = [kr.weight for kr in key_results]
    
    if not validate_weights_sum_to_one(weights):
        total = sum(float(w) for w in weights)
        return False, f"Key Result weights must sum to 1.0 (currently {total:.3f})"
    
    return True, ""


def update_kr_current_value(db: Session, kr_id: int, new_value: Decimal) -> KeyResult:
    """
    Update a Key Result's current value (typically done weekly by Manager).
    
    Args:
        db: Database session
        kr_id: Key Result ID
        new_value: New current value
    
    Returns:
        Updated KeyResult
    """
    kr = db.query(KeyResult).filter(KeyResult.id == kr_id).first()
    
    if not kr:
        return None
    
    kr.current_value = new_value
    db.commit()
    db.refresh(kr)
    
    return kr


