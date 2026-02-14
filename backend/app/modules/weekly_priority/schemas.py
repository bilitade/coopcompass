"""Weekly Priority schemas - Simplified for team-stage functionality."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class WeeklyPriorityCreate(BaseModel):
    """Weekly priority creation schema."""
    work_item_id: int = Field(..., gt=0)
    week: str = Field(..., pattern=r"^\d{4}-W\d{2}$")
    priority: int = Field(..., ge=1, le=3)


class WeeklyPriorityUpdate(BaseModel):
    """Weekly priority update schema."""
    priority: int = Field(..., ge=1, le=3)


class WeeklyPriorityResponse(BaseModel):
    """Weekly priority response schema."""
    id: int
    work_item_id: int
    week: str
    priority: int
    created_at: datetime

    class Config:
        from_attributes = True
