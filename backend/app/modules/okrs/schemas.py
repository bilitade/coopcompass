"""OKR schemas."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List
from datetime import datetime
from decimal import Decimal
from typing import Optional


class KeyResultCreate(BaseModel):
    """Key result creation schema."""
    description: str = Field(..., min_length=1)
    target_value: Decimal = Field(..., gt=0)
    unit: Optional[str] = None


class KeyResultUpdate(BaseModel):
    """Key result update schema."""
    description: Optional[str] = None
    target_value: Optional[Decimal] = Field(None, gt=0)
    unit: Optional[str] = None
    current_value: Optional[Decimal] = None


class KeyResultResponse(BaseModel):
    """Key result response schema."""
    id: int
    okr_id: int
    description: str
    target_value: Decimal
    current_value: Decimal
    unit: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OKRCreate(BaseModel):
    """OKR creation schema."""
    quarter: str = Field(..., pattern=r"^Q[1-4] \d{4}$")
    objective: str = Field(..., min_length=1)


class OKRUpdate(BaseModel):
    """OKR update schema."""
    quarter: Optional[str] = None
    objective: Optional[str] = None
    is_active: Optional[bool] = None


class OKRResponse(BaseModel):
    """OKR response schema."""
    id: int
    team_id: int
    quarter: str
    objective: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OKRDetailResponse(OKRResponse):
    """OKR detail response with key results."""
    key_results: List[KeyResultResponse] = []


# Progress schemas
class KRProgressResponse(BaseModel):
    """Key result progress response."""
    kr_id: int
    description: str
    progress: float = Field(..., ge=0, le=100)
    current_value: Decimal
    target_value: Decimal


class OKRProgressResponse(BaseModel):
    """OKR progress response."""
    okr_id: int
    objective: str
    quarter: str
    progress: float = Field(..., ge=0, le=100)
    key_results: List[KRProgressResponse] = []

