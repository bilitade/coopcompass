"""Monthly Heads-Up schemas."""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class MonthlyHeadsUpBase(BaseModel):
    month: str = Field(..., pattern=r"^\d{4}-\d{2}$")  # YYYY-MM
    description: str = Field(..., min_length=1)
    focus_areas: Optional[List[str]] = None
    strategic_alignment: Optional[str] = None
    risks_and_considerations: Optional[List[str]] = None


class MonthlyHeadsUpCreate(MonthlyHeadsUpBase):
    pass


class MonthlyHeadsUpUpdate(BaseModel):
    description: Optional[str] = None
    focus_areas: Optional[List[str]] = None
    strategic_alignment: Optional[str] = None
    risks_and_considerations: Optional[List[str]] = None


class MonthlyHeadsUpResponse(MonthlyHeadsUpBase):
    id: int
    team_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
