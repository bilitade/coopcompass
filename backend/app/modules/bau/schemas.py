"""BAU schemas."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal


class BAUMetricCreate(BaseModel):
    """BAU metric creation schema."""
    name: str = Field(..., min_length=1)
    target_value: Decimal = Field(..., gt=0)
    unit: Optional[str] = None
    weight: Decimal = Field(1.0, ge=0, le=1)
    is_higher_better: bool = True


class BAUMetricUpdate(BaseModel):
    """BAU metric update schema."""
    name: Optional[str] = None
    target_value: Optional[Decimal] = Field(None, gt=0)
    unit: Optional[str] = None
    weight: Optional[Decimal] = Field(None, ge=0, le=1)
    is_higher_better: Optional[bool] = None
    current_value: Optional[Decimal] = None


class BAUMetricResponse(BaseModel):
    """BAU metric response schema."""
    id: int
    bau_activity_id: int
    name: str
    target_value: Decimal
    current_value: Decimal
    unit: Optional[str]
    weight: Decimal
    is_higher_better: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BAUActivityCreate(BaseModel):
    """BAU activity creation schema."""
    name: str = Field(..., min_length=1)
    description: Optional[str] = None


class BAUActivityUpdate(BaseModel):
    """BAU activity update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class BAUActivityResponse(BaseModel):
    """BAU activity response schema."""
    id: int
    team_id: int
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BAUActivityDetailResponse(BAUActivityResponse):
    """BAU activity detail response with metrics."""
    metrics: List[BAUMetricResponse] = []


class MetricHistoryResponse(BaseModel):
    """Metric history response schema."""
    id: int
    bau_metric_id: int
    value: Decimal
    recorded_at: datetime

    class Config:
        from_attributes = True


# Progress schemas
class BAUHealthResponse(BaseModel):
    """BAU health response."""
    activity_id: int
    activity_name: str
    health: float = Field(..., ge=0, le=100)
    metrics: List[BAUMetricResponse] = []

