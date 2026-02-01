"""Work Item schemas."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.modules.users.schemas import UserResponse


class TaskCreate(BaseModel):
    """Task creation schema."""
    description: str = Field(..., min_length=1)
    assignee_id: Optional[int] = None
    effort_hours: Optional[int] = Field(None, gt=0)


class TaskUpdate(BaseModel):
    """Task update schema."""
    description: Optional[str] = None
    assignee_id: Optional[int] = None
    status: Optional[str] = Field(None, pattern="^(Not Started|In Progress|Done|Blocked)$")
    effort_hours: Optional[int] = Field(None, gt=0)
    blocked_reason: Optional[str] = None


class TaskResponse(BaseModel):
    """Task response schema."""
    id: int
    work_item_id: int
    description: str
    assignee_id: Optional[int]
    status: str
    effort_hours: Optional[int]
    blocked_reason: Optional[str]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class TaskDetailResponse(TaskResponse):
    """Task detail response with assignee and work item."""
    assignee: Optional[UserResponse] = None


class WorkItemSmallResponse(BaseModel):
    """Small work item response for embedding in tasks."""
    id: int
    name: str
    source_type: str
    month: str

    class Config:
        from_attributes = True


class TaskWithWorkItemResponse(TaskResponse):
    """Task response with embedded work item information."""
    work_item: Optional[WorkItemSmallResponse] = None

    class Config:
        from_attributes = True


class WorkItemCreate(BaseModel):
    """Work item creation schema."""
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    source_type: str = Field(..., pattern="^(OKR|BAU)$")
    source_id: int = Field(..., gt=0)
    owner_id: Optional[int] = None
    month: str = Field(..., pattern=r"^\d{4}-\d{2}$")


class WorkItemUpdate(BaseModel):
    """Work item update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    owner_id: Optional[int] = None


class WorkItemResponse(BaseModel):
    """Work item response schema."""
    id: int
    team_id: int
    name: str
    description: Optional[str]
    source_type: str
    source_id: int
    owner_id: Optional[int]
    month: str
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

