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


class PerformanceTrendResponse(BaseModel):
    """Performance trend response schema."""
    date: datetime
    okr_progress: float
    bau_health: float

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    """Team dashboard response schema."""
    team_id: int
    okr_progress: float
    bau_health: float
    okrs: List[dict]
    bau_activities: List[dict]
    current_week_priorities: List[dict]
    updated_at: datetime

    class Config:
        from_attributes = True


class TeamDashboardSummaryResponse(BaseModel):
    """Team dashboard summary response schema."""
    team_id: int
    team_name: str
    members_count: int
    okr_progress: float
    bau_health: float

    class Config:
        from_attributes = True


class DepartmentDashboardResponse(BaseModel):
    """Department dashboard response schema."""
    department_id: int
    total_teams: int
    total_members: int
    average_okr_progress: float
    average_bau_health: float
    teams: List[TeamDashboardSummaryResponse]
    updated_at: datetime

    class Config:
        from_attributes = True


class DepartmentSummaryResponse(BaseModel):
    """Department summary response schema."""
    department_id: int
    department_name: str
    director_name: Optional[str]
    teams_count: int
    members_count: int
    okr_progress: float
    bau_health: float

    class Config:
        from_attributes = True


class OrganizationDashboardResponse(BaseModel):
    """Organization dashboard response schema."""
    total_departments: int
    total_teams: int
    total_members: int
    total_directors: int
    average_okr_progress: float
    average_bau_health: float
    departments: List[DepartmentSummaryResponse]
    updated_at: datetime

    class Config:
        from_attributes = True
