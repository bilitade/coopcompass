"""Team schemas."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.modules.users.schemas import UserResponse


class TeamCreate(BaseModel):
    """Team creation schema."""
    name: str = Field(..., min_length=1)
    department_id: Optional[int] = None


class TeamResponse(BaseModel):
    """Team response schema."""
    id: int
    name: str
    department_id: Optional[int] = None
    department: Optional['DepartmentResponse'] = None
    users: Optional[List[UserResponse]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TeamUpdate(BaseModel):
    """Team update schema."""
    name: Optional[str] = Field(None, min_length=1)
    department_id: Optional[int] = None


class TeamDetailResponse(TeamResponse):
    """Team detail response with users."""
    users: List[UserResponse] = []

