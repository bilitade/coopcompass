"""OKR schemas."""

from __future__ import annotations
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List, Optional, Literal
from datetime import datetime
from decimal import Decimal


class KeyResultCreate(BaseModel):
    """Key result creation schema - current_value is optional, defaults to base_value."""
    description: str = Field(..., min_length=1, max_length=500)
    base_value: Decimal = Field(..., description="Starting baseline value")
    target_value: Decimal = Field(..., description="Goal value to achieve")
    current_value: Optional[Decimal] = Field(None, description="Current progress (optional, defaults to base_value)")
    unit: str = Field(..., min_length=1, max_length=50, description="Measurement unit (customers, Birr, %, count, services, etc.)")
    weight: Decimal = Field(..., ge=0, le=1, description="Importance (0.0-1.0, must sum to 1.0 per Objective)")


class KeyResultUpdate(BaseModel):
    """Key result update schema."""
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    base_value: Optional[Decimal] = None
    target_value: Optional[Decimal] = None
    current_value: Optional[Decimal] = None
    unit: Optional[str] = Field(None, min_length=1, max_length=50)
    weight: Optional[Decimal] = Field(None, ge=0, le=1)


class KeyResultResponse(BaseModel):
    """Key result response schema."""
    id: int
    okr_id: int
    description: str
    base_value: Decimal
    target_value: Decimal
    current_value: Decimal
    unit: str
    weight: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class KeyResultWithScore(KeyResultResponse):
    """Key result with calculated score."""
    score: float = Field(..., ge=0, le=1, description="Calculated KR score (0.0-1.0)")


class OKRCreate(BaseModel):
    """OKR creation schema."""
    okr_level: Literal["strategic", "operational", "tactical"] = Field(..., description="OKR level")
    year: int = Field(..., ge=2024, le=2050, description="Year (e.g., 2025, 2026)")
    quarter: Literal["Q1", "Q2", "Q3", "Q4"] = Field(..., description="Single quarter")
    objective: str = Field(..., min_length=1, max_length=1000, description="Objective statement")
    description: Optional[str] = Field(None, max_length=5000, description="Detailed description of the objective")
    status: Optional[Literal["draft", "active", "completed"]] = Field("draft", description="OKR status")
    key_results: Optional[List[KeyResultCreate]] = Field(default=None, description="Initial key results (optional)")
    
    @model_validator(mode='after')
    def validate_key_results_weights(self):
        """Validate that key results weights sum to 1.0 if provided."""
        if self.key_results and len(self.key_results) > 0:
            total_weight = sum(float(kr.weight) for kr in self.key_results)
            if abs(total_weight - 1.0) > 0.01:
                raise ValueError(f"Key Result weights must sum to 1.0 (currently {total_weight:.3f})")
        return self


class OKRUpdate(BaseModel):
    """OKR update schema."""
    okr_level: Optional[Literal["strategic", "operational", "tactical"]] = None
    year: Optional[int] = Field(None, ge=2024, le=2050)
    quarter: Optional[Literal["Q1", "Q2", "Q3", "Q4"]] = None
    objective: Optional[str] = Field(None, min_length=1, max_length=1000)
    description: Optional[str] = Field(None, max_length=5000)
    status: Optional[Literal["draft", "active", "completed"]] = None
    is_active: Optional[bool] = None


class OKRResponse(BaseModel):
    """OKR response schema."""
    id: int
    team_id: int
    year: Optional[int] = None
    quarters: Optional[str] = None  # Comma-separated string like "Q1"
    okr_level: Optional[str] = None
    objective: str
    description: Optional[str] = None
    status: Optional[str] = "draft"
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    # Legacy field for backward compatibility
    quarter: Optional[str] = None

    class Config:
        from_attributes = True


class OKRDetailResponse(OKRResponse):
    """OKR detail response with key results."""
    key_results: List[KeyResultResponse] = []


class OKRWithScoreResponse(OKRResponse):
    """OKR response with calculated scores."""
    key_results: List[KeyResultWithScore] = []
    objective_score: float = Field(..., ge=0, le=1, description="Overall objective score")
    status: str = Field(..., description="Status: Green, Yellow, or Red")


