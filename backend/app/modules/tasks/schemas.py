"""Task schemas."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
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
    """Task detail response with assignee."""
    assignee: Optional[UserResponse] = None


class WorkItemSmallResponse(BaseModel):
    """Small work item response for embedding in tasks."""
    id: int
    title: str
    source_type: str
    month: str

    class Config:
        from_attributes = True


class TaskWithWorkItemResponse(TaskResponse):
    """Task response with embedded work item information."""
    work_item: Optional[WorkItemSmallResponse] = None

    class Config:
        from_attributes = True


class PrioritizedWorkItemResponse(BaseModel):
    """Simplified work item response for priority selection."""
    id: int
    title: str
    priority: int
    source_type: str

    class Config:
        from_attributes = True
