"""Weekly Priority and Dashboard schemas."""

from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


class WeeklyPriorityPlanCreate(BaseModel):
    monthly_headsup_id: int = Field(..., gt=0)
    week: str = Field(..., pattern=r"^\d{4}-W\d{2}$")
    week_focus: str = Field(..., min_length=1)


class WeeklyPriorityPlanUpdate(BaseModel):
    week_focus: Optional[str] = None


class WeeklyPriorityCreate(BaseModel):
    plan_id: int = Field(..., gt=0)
    work_item_id: int = Field(..., gt=0)
    priority: int = Field(..., ge=1, le=3)


class WeeklyPriorityPlanResponse(BaseModel):
    id: int
    monthly_headsup_id: int
    week: str
    week_focus: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WeeklyPriorityResponse(BaseModel):
    id: int
    plan_id: int
    work_item_id: int
    priority: int
    created_at: datetime

    class Config:
        from_attributes = True


class WeeklyPriorityWithProgressResponse(BaseModel):
    priority_id: int
    work_item_id: int
    work_item_name: str
    priority: int
    progress: float = Field(..., ge=0, le=100)


# Dashboard Schemas

class DashboardResponse(BaseModel):
    team_id: int
    okr_progress: float
    bau_health: float
    okrs: List[Any]
    bau_activities: List[Any]
    current_week_priorities: List[WeeklyPriorityWithProgressResponse]
    weekly_plan: Optional[Any] = None
    updated_at: datetime


class PerformanceTrendResponse(BaseModel):
    date: str
    okr_progress: float
    bau_health: float


class TeamDashboardSummaryResponse(BaseModel):
    team_id: int
    team_name: str
    members_count: int
    okr_progress: float
    bau_health: float


class DepartmentDashboardResponse(BaseModel):
    department_id: int
    total_teams: int
    total_members: int
    average_okr_progress: float
    average_bau_health: float
    teams: List[TeamDashboardSummaryResponse]
    updated_at: datetime


class DepartmentSummaryResponse(BaseModel):
    department_id: int
    department_name: str
    director_name: Optional[str] = None
    teams_count: int
    members_count: int
    okr_progress: float
    bau_health: float


class OrganizationDashboardResponse(BaseModel):
    total_departments: int
    total_teams: int
    total_members: int
    total_directors: int
    average_okr_progress: float
    average_bau_health: float
    departments: List[DepartmentSummaryResponse]
    updated_at: datetime
