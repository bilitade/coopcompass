"""State schemas for weekly planner LangGraph."""
from typing import Any, Dict, List, Optional, TypedDict
from pydantic import BaseModel, Field


class WorkItemContext(BaseModel):
    """Work item context for weekly planning."""
    id: int
    title: str
    description: Optional[str] = None
    source_type: str  # "OKR" or "BAU"
    source_id: int
    source_name: str
    status: str
    progress: float = 0.0  # 0-100
    owner_id: Optional[int] = None
    owner_name: Optional[str] = None
    created_at: str


class WeeklyContext(BaseModel):
    """Weekly planning context."""
    monthly_headsup_id: int
    month: str  # YYYY-MM
    week: str  # YYYY-Www
    week_number: int  # Week number in month (1-4/5)
    monthly_description: str
    monthly_focus_areas: List[str] = Field(default_factory=list)
    work_items: List[WorkItemContext] = Field(default_factory=list)
    previous_week_priorities: List[Dict[str, Any]] = Field(default_factory=list)
    current_okr_progress: Dict[str, float] = Field(default_factory=dict)
    current_bau_health: Dict[str, float] = Field(default_factory=dict)


class PrioritizedWorkItem(BaseModel):
    """Work item with priority assignment."""
    work_item_id: int
    priority: int = Field(..., ge=1, le=3, description="1=P1 (Must Do), 2=P2 (Should Do), 3=P3 (Nice to Do)")
    rationale: str = Field(..., description="Why this priority level for this week")


class WeeklyPlanOutput(BaseModel):
    """AI-generated weekly plan."""
    week_focus: str = Field(..., description="Focus statement for the week")
    prioritized_work_items: List[PrioritizedWorkItem] = Field(..., description="Work items with priorities (P1, P2, P3)")
    strategic_rationale: str = Field(..., description="Why these priorities align with monthly goals")
    estimated_effort: str = Field(..., description="Estimated effort distribution across priorities")


class GraphState(TypedDict, total=False):
    """State for weekly planner LangGraph."""
    weekly_context: Optional[WeeklyContext]
    weekly_plan: Optional[WeeklyPlanOutput]
    progress_callback: Optional[Any]  # Callable[[ProgressEvent], None]

