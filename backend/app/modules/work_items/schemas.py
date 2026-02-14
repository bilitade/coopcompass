"""Work Item schemas."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.modules.users.schemas import UserResponse
from app.modules.tasks.schemas import TaskResponse


class WorkItemSmallResponse(BaseModel):
    """Small work item response for embedding in tasks."""
    id: int
    title: str
    source_type: str
    month: Optional[str] = None

    class Config:
        from_attributes = True


class WorkItemCreate(BaseModel):
    """Work item creation schema."""
    title: str = Field(..., min_length=1, max_length=500)
    monthly_headsup_id: int = Field(..., gt=0)
    description: Optional[str] = None
    source_type: str = Field(..., pattern="^(OKR|BAU)$")
    source_id: int = Field(..., gt=0)
    owner_id: Optional[int] = None


class WorkItemUpdate(BaseModel):
    """Work item update schema."""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    monthly_headsup_id: Optional[int] = Field(None, gt=0)
    description: Optional[str] = None
    owner_id: Optional[int] = None
    status: Optional[str] = Field(None, pattern="^(Not Started|In Progress|Completed)$")


class WorkItemResponse(BaseModel):
    """Work item response schema."""
    id: int
    team_id: int
    monthly_headsup_id: int
    title: str
    description: Optional[str]
    source_type: str
    source_id: int
    owner_id: Optional[int]
    status: str
    month: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkItemDetailResponse(WorkItemResponse):
    """Work item detail response with tasks and owner."""
    owner: Optional[UserResponse] = None
    tasks: List[TaskResponse] = []


class WorkItemWithSourceResponse(WorkItemResponse):
    """Work item response with related OKR Key Result or BAU Activity data."""
    key_result: Optional['KeyResultResponse'] = None
    bau_activity: Optional['BAUActivityResponse'] = None


# Weekly Priority schemas moved to weekly_priority module


# Forward references will be resolved in schemas/__init__.py

