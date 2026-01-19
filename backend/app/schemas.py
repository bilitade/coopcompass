"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# ============ Auth Schemas ============

class UserBase(BaseModel):
    """Base user schema."""
    name: str
    email: EmailStr
    role: str = Field(..., pattern="^(member|lead|executive)$")


class UserCreate(UserBase):
    """User creation schema."""
    password: str = Field(..., min_length=8)


class UserResponse(UserBase):
    """User response schema."""
    id: int
    team_id: Optional[int] = None
    team_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """User login schema."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response following OAuth2 standards."""
    access_token: str
    token_type: str = "Bearer"  # OAuth2 standard capitalization
    user: UserResponse

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "Bearer",
                "user": {
                    "id": 1,
                    "name": "John Doe",
                    "email": "john@example.com",
                    "role": "member"
                }
            }
        }


class OAuth2TokenResponse(BaseModel):
    """OAuth2 RFC 6749 compliant token response."""
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    scope: str = ""

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "Bearer",
                "expires_in": 1800,
                "scope": ""
            }
        }


# ============ Team Schemas ============

class TeamCreate(BaseModel):
    """Team creation schema."""
    name: str = Field(..., min_length=1)


class TeamResponse(BaseModel):
    """Team response schema."""
    id: int
    name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TeamDetailResponse(TeamResponse):
    """Team detail response with users."""
    users: List[UserResponse] = []


# ============ OKR/KR Schemas ============

class KeyResultCreate(BaseModel):
    """Key result creation schema."""
    description: str = Field(..., min_length=1)
    target_value: Decimal = Field(..., gt=0)
    unit: Optional[str] = None


class KeyResultUpdate(BaseModel):
    """Key result update schema."""
    description: Optional[str] = None
    target_value: Optional[Decimal] = Field(None, gt=0)
    unit: Optional[str] = None
    current_value: Optional[Decimal] = None


class KeyResultResponse(BaseModel):
    """Key result response schema."""
    id: int
    okr_id: int
    description: str
    target_value: Decimal
    current_value: Decimal
    unit: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OKRCreate(BaseModel):
    """OKR creation schema."""
    quarter: str = Field(..., pattern=r"^Q[1-4] \d{4}$")
    objective: str = Field(..., min_length=1)


class OKRUpdate(BaseModel):
    """OKR update schema."""
    objective: Optional[str] = None
    is_active: Optional[bool] = None


class OKRResponse(BaseModel):
    """OKR response schema."""
    id: int
    team_id: int
    quarter: str
    objective: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OKRDetailResponse(OKRResponse):
    """OKR detail response with key results."""
    key_results: List[KeyResultResponse] = []


# ============ BAU Schemas ============

class BAUMetricCreate(BaseModel):
    """BAU metric creation schema."""
    name: str = Field(..., min_length=1)
    target_value: Decimal = Field(..., gt=0)
    unit: Optional[str] = None
    weight: Decimal = Field(1.0, ge=0, le=1)
    is_higher_better: bool = True


class BAUMetricUpdate(BaseModel):
    """BAU metric update schema."""
    name: Optional[str] = None
    target_value: Optional[Decimal] = Field(None, gt=0)
    unit: Optional[str] = None
    weight: Optional[Decimal] = Field(None, ge=0, le=1)
    is_higher_better: Optional[bool] = None
    current_value: Optional[Decimal] = None


class BAUMetricResponse(BaseModel):
    """BAU metric response schema."""
    id: int
    bau_activity_id: int
    name: str
    target_value: Decimal
    current_value: Decimal
    unit: Optional[str]
    weight: Decimal
    is_higher_better: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BAUActivityCreate(BaseModel):
    """BAU activity creation schema."""
    name: str = Field(..., min_length=1)
    description: Optional[str] = None


class BAUActivityUpdate(BaseModel):
    """BAU activity update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class BAUActivityResponse(BaseModel):
    """BAU activity response schema."""
    id: int
    team_id: int
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BAUActivityDetailResponse(BAUActivityResponse):
    """BAU activity detail response with metrics."""
    metrics: List[BAUMetricResponse] = []


class MetricHistoryResponse(BaseModel):
    """Metric history response schema."""
    id: int
    bau_metric_id: int
    value: Decimal
    recorded_at: datetime

    class Config:
        from_attributes = True


# ============ Work Item Schemas ============

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


# ============ Weekly Priority Schemas ============

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


# ============ Dashboard Schemas ============

class KRProgressResponse(BaseModel):
    """Key result progress response."""
    kr_id: int
    description: str
    progress: float = Field(..., ge=0, le=100)
    current_value: Decimal
    target_value: Decimal


class OKRProgressResponse(BaseModel):
    """OKR progress response."""
    okr_id: int
    objective: str
    quarter: str
    progress: float = Field(..., ge=0, le=100)
    key_results: List[KRProgressResponse] = []


class BAUHealthResponse(BaseModel):
    """BAU health response."""
    activity_id: int
    activity_name: str
    health: float = Field(..., ge=0, le=100)
    metrics: List[BAUMetricResponse] = []


class WeeklyPriorityWithProgressResponse(BaseModel):
    """Weekly priority with progress."""
    priority_id: int
    work_item_id: int
    work_item_name: str
    priority: int
    progress: float = Field(..., ge=0, le=100)


class DashboardResponse(BaseModel):
    """Team dashboard response."""
    team_id: int
    okr_progress: float = Field(..., ge=0, le=100)
    bau_health: float = Field(..., ge=0, le=100)
    okrs: List[OKRProgressResponse] = []
    bau_activities: List[BAUHealthResponse] = []
    current_week_priorities: List[WeeklyPriorityWithProgressResponse] = []
    updated_at: datetime


class PerformanceTrendResponse(BaseModel):
    """Performance trend over time."""
    date: str
    okr_progress: float = Field(..., ge=0, le=100)
    bau_health: float = Field(..., ge=0, le=100)

