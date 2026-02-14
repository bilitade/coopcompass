"""BAU schemas."""

from __future__ import annotations
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime
from decimal import Decimal


class BAUMetricCreate(BaseModel):
    """BAU metric creation schema."""
    name: str = Field(..., min_length=1, max_length=255)
    target_value: Decimal = Field(..., description="Goal value")
    current_value: Decimal = Field(default=0, description="Actual value (defaults to 0)")
    unit: Optional[str] = Field(default="", min_length=0, max_length=50, description="Measurement unit (%, minutes, hours, count, etc.)")
    weight: Decimal = Field(..., ge=0, le=1, description="Importance (0.0-1.0, must sum to 1.0 per Activity)")
    metric_type: str = Field(default="Higher is Better", description="Type: 'Higher is Better' or 'Lower is Better'")

    @field_validator('metric_type')
    @classmethod
    def validate_metric_type(cls, v):
        """Validate metric type."""
        if v not in ['Higher is Better', 'Lower is Better']:
            raise ValueError("metric_type must be 'Higher is Better' or 'Lower is Better'")
        return v


class BAUMetricUpdate(BaseModel):
    """BAU metric update schema."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    target_value: Optional[Decimal] = None
    current_value: Optional[Decimal] = None
    unit: Optional[str] = Field(None, min_length=0, max_length=50)
    weight: Optional[Decimal] = Field(None, ge=0, le=1)
    metric_type: Optional[str] = None

    @field_validator('metric_type')
    @classmethod
    def validate_metric_type(cls, v):
        """Validate metric type."""
        if v is not None and v not in ['Higher is Better', 'Lower is Better']:
            raise ValueError("metric_type must be 'Higher is Better' or 'Lower is Better'")
        return v


class BAUMetricResponse(BaseModel):
    """BAU metric response schema."""
    id: int
    bau_activity_id: int
    name: str
    target_value: Decimal
    current_value: Decimal
    unit: str
    weight: Decimal
    metric_type: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BAUMetricWithAchievement(BAUMetricResponse):
    """BAU metric with calculated achievement."""
    achievement: float = Field(..., ge=0, le=100, description="Calculated achievement percentage (0-100)")


class BAUActivityCreate(BaseModel):
    """BAU activity creation schema."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class BAUActivityUpdate(BaseModel):
    """BAU activity update schema."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
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


class BAUActivityWithScore(BAUActivityResponse):
    """BAU activity with calculated scores."""
    metrics: List[BAUMetricWithAchievement] = []
    activity_score: float = Field(..., ge=0, le=100, description="Activity score (0-100%)")


class BAUOverallHealthResponse(BaseModel):
    """Overall BAU health for a team."""
    team_id: int
    activities: List[BAUActivityWithScore] = []
    overall_health: float = Field(..., ge=0, le=100, description="Overall BAU health (0-100%)")
    status: str = Field(..., description="Status: Excellent, Good, Acceptable, Warning, or Poor")


