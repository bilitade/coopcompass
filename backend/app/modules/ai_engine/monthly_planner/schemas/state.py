"""State schemas for monthly planner LangGraph."""
from typing import Any, Dict, List, Optional, TypedDict
from pydantic import BaseModel, Field


class TeamContext(BaseModel):
    """Team context information."""
    team_id: int
    team_name: str
    month: str  # YYYY-MM format
    okrs: List[Dict[str, Any]] = Field(default_factory=list)
    bau_activities: List[Dict[str, Any]] = Field(default_factory=list)
    previous_month_work_items: List[Dict[str, Any]] = Field(default_factory=list)
    current_okr_progress: Dict[str, float] = Field(default_factory=dict)
    current_bau_health: Dict[str, float] = Field(default_factory=dict)


class WorkItemSuggestion(BaseModel):
    """Suggested work item from AI."""
    title: str = Field(..., description="Work item title")
    description: str = Field(..., description="Detailed description of the work item")
    source_type: str = Field(..., description="Either 'OKR' or 'BAU'")
    source_id: int = Field(..., description="ID of the related OKR Key Result or BAU Activity")
    source_name: str = Field(..., description="Name of the related source (KR description or BAU activity name)")
    priority: str = Field(..., description="Suggested priority: High, Medium, or Low")
    rationale: str = Field(..., description="Why this work item is important for the month")


class MonthlyPlanOutput(BaseModel):
    """AI-generated monthly plan."""
    description: str = Field(..., description="Monthly heads-up description")
    focus_areas: List[str] = Field(..., description="Key focus areas for the month")
    work_items: List[WorkItemSuggestion] = Field(..., description="Suggested work items (5-10 items)")
    strategic_alignment: str = Field(..., description="How this month aligns with strategic goals")
    risks_and_considerations: List[str] = Field(default_factory=list, description="Potential risks or considerations")


class GraphState(TypedDict, total=False):
    """State for monthly planner LangGraph."""
    team_context: Optional[TeamContext]
    monthly_plan: Optional[MonthlyPlanOutput]
    progress_callback: Optional[Any]  # Callable[[ProgressEvent], None]

