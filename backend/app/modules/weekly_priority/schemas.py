"""Weekly Priority schemas."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.modules.okrs.schemas import OKRProgressResponse
from app.modules.bau.schemas import BAUHealthResponse
from app.modules.work_items.schemas import WeeklyPriorityWithProgressResponse


class DashboardResponse(BaseModel):
    """Team dashboard response."""
    team_id: int
    okr_progress: float = Field(..., ge=0, le=100)
    bau_health: float = Field(..., ge=0, le=100)
    bau_execution: float = Field(..., ge=0, le=100)
    okrs: List[OKRProgressResponse] = []
    bau_activities: List[BAUHealthResponse] = []
    current_week_priorities: List[WeeklyPriorityWithProgressResponse] = []
    updated_at: datetime


class PerformanceTrendResponse(BaseModel):
    """Performance trend over time."""
    date: str
    okr_progress: float = Field(..., ge=0, le=100)
    bau_health: float = Field(..., ge=0, le=100)


class TeamDashboardSummaryResponse(BaseModel):
    """Team summary for department/organization dashboards."""
    team_id: int
    team_name: str
    members_count: int
    okr_progress: float = Field(..., ge=0, le=100)
    bau_health: float = Field(..., ge=0, le=100)
    bau_execution: float = Field(..., ge=0, le=100)


class DepartmentDashboardResponse(BaseModel):
    """Department dashboard response."""
    department_id: int
    total_teams: int
    total_members: int
    average_okr_progress: float = Field(..., ge=0, le=100)
    average_bau_health: float = Field(..., ge=0, le=100)
    average_bau_execution: float = Field(..., ge=0, le=100)
    teams: List[TeamDashboardSummaryResponse] = []
    updated_at: datetime


class DepartmentSummaryResponse(BaseModel):
    """Department summary for organization dashboard."""
    department_id: int
    department_name: str
    director_name: Optional[str] = None
    teams_count: int
    members_count: int
    okr_progress: float = Field(..., ge=0, le=100)
    bau_health: float = Field(..., ge=0, le=100)
    bau_execution: float = Field(..., ge=0, le=100)


class OrganizationDashboardResponse(BaseModel):
    """Organization (executive) dashboard response."""
    total_departments: int
    total_teams: int
    total_members: int
    total_directors: int
    average_okr_progress: float = Field(..., ge=0, le=100)
    average_bau_health: float = Field(..., ge=0, le=100)
    average_bau_execution: float = Field(..., ge=0, le=100)
    departments: List[DepartmentSummaryResponse] = []
    updated_at: datetime

