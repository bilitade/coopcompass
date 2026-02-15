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
    """Schema for snapshot response with comprehensive team data for report generation."""
    id: int
    team_id: int
    
    # Team Context
    team_name: Optional[str] = None
    team_size: int = 0
    manager_id: Optional[int] = None
    manager_name: Optional[str] = None
    team_members: Optional[List[Dict[str, Any]]] = None
    
    # OKR Context & Scores
    okr_id: Optional[int] = None
    okr_objective: Optional[str] = None
    okr_target_score: Optional[Decimal] = None
    okr_current_score: Optional[Decimal] = None
    okr_key_results: Optional[List[Dict[str, Any]]] = None
    
    # Legacy OKR fields (for backward compatibility)
    okr_objective_score: Optional[Decimal] = None
    kr1_score: Optional[Decimal] = None
    kr2_score: Optional[Decimal] = None
    kr3_score: Optional[Decimal] = None
    kr4_score: Optional[Decimal] = None
    kr5_score: Optional[Decimal] = None
    okr_data: Optional[Dict[str, Any]] = None
    
    # BAU Context & Scores
    bau_activities: Optional[List[Dict[str, Any]]] = None
    bau_overall_health: Optional[Decimal] = None
    bau_data: Optional[Dict[str, Any]] = None  # Legacy field
    
    # Work Items (Planned & Completed)
    work_items_planned: Optional[List[Dict[str, Any]]] = None  # JSONB
    work_items_completed: Optional[List[Dict[str, Any]]] = None  # JSONB
    work_items_count_planned: int = 0
    work_items_count_completed: int = 0
    work_items_completion_rate: Optional[Decimal] = None
    
    # Weekly Priority Plan
    weekly_priority_plan: Optional[Dict[str, Any]] = None
    
    # Tasks
    tasks: Optional[List[Dict[str, Any]]] = None  # JSONB
    tasks_count_planned: int = 0
    tasks_count_completed: int = 0
    tasks_completion_rate: Optional[Decimal] = None
    
    # Legacy task fields (for backward compatibility)
    tasks_planned: int = 0
    tasks_completed: int = 0
    
    # Metadata
    snapshot_version: str = "1.0"
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

