"""Snapshot schemas."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal


class WeeklySnapshotBase(BaseModel):
    """Base snapshot schema."""
    week: str = Field(..., description="Week in ISO format (e.g., 2026-W07)")
    quarter: str = Field(..., description="Quarter (e.g., Q1 2026)")


class WeeklySnapshotCreate(WeeklySnapshotBase):
    """Schema for creating a snapshot."""
    team_id: int = Field(..., description="Team ID")


class WeeklySnapshotResponse(WeeklySnapshotBase):
    """Schema for snapshot response."""
    id: int
    team_id: int
    
    # Outcomes - OKR
    okr_objective_score: Optional[Decimal] = None
    kr1_score: Optional[Decimal] = None
    kr2_score: Optional[Decimal] = None
    kr3_score: Optional[Decimal] = None
    kr4_score: Optional[Decimal] = None
    kr5_score: Optional[Decimal] = None
    
    # Outcomes - BAU
    bau_overall_health: Optional[Decimal] = None
    
    # Work Item Execution
    work_items_planned: int = 0
    work_items_completed: int = 0
    work_items_completion_rate: Optional[Decimal] = None
    
    # Task Execution
    tasks_planned: int = 0
    tasks_completed: int = 0
    tasks_completion_rate: Optional[Decimal] = None
    
    # Context
    team_size: int = 0
    
    # Detailed data
    okr_data: Optional[Dict[str, Any]] = None
    bau_data: Optional[Dict[str, Any]] = None
    
    created_at: datetime
    
    class Config:
        from_attributes = True


class WeeklySnapshotListResponse(BaseModel):
    """Response for listing snapshots."""
    snapshots: List[WeeklySnapshotResponse]
    total: int


class SnapshotTrendResponse(BaseModel):
    """Response for snapshot trends."""
    week: str
    okr_score: Optional[float] = None
    bau_health: Optional[float] = None
    work_items_completion_rate: Optional[float] = None
    tasks_completion_rate: Optional[float] = None

