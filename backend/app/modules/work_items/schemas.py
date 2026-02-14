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
    month: str

    class Config:
        from_attributes = True


class WorkItemCreate(BaseModel):
    """Work item creation schema."""
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    source_type: str = Field(..., pattern="^(OKR|BAU)$")
    source_id: int = Field(..., gt=0)
    owner_id: Optional[int] = None
    month: str = Field(..., pattern=r"^\d{4}-\d{2}$")


class WorkItemUpdate(BaseModel):
    """Work item update schema."""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    owner_id: Optional[int] = None
    status: Optional[str] = Field(None, pattern="^(Not Started|In Progress|Completed)$")


class WorkItemResponse(BaseModel):
    """Work item response schema."""
    id: int
    team_id: int
    title: str
    description: Optional[str]
    source_type: str
    source_id: int
    owner_id: Optional[int]
    month: str
    status: str
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


# Weekly Priority schemas
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


class WeeklyPriorityWithProgressResponse(BaseModel):
    """Weekly priority with progress."""
    priority_id: int
    work_item_id: int
    work_item_name: str
    priority: int
    progress: float = Field(..., ge=0, le=100)


# Forward references will be resolved in schemas/__init__.py

