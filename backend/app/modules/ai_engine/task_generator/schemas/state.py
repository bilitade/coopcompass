"""State schemas for task generator LangGraph."""
from typing import Any, Dict, List, Optional, TypedDict
from pydantic import BaseModel, Field


class TeamMemberContext(BaseModel):
    """Team member context for task assignment."""
    id: int
    name: str
    email: str
    role: str
    current_workload: int = Field(default=0, description="Number of active tasks")


class WorkItemPriorityContext(BaseModel):
    """Work item with priority context for task generation."""
    work_item_id: int
    title: str
    description: Optional[str] = None
    priority: int  # 1=P1, 2=P2, 3=P3
    source_type: str  # "OKR" or "BAU"
    source_name: str
    status: str
    progress: float = 0.0  # 0-100
    existing_tasks: List[Dict[str, Any]] = Field(default_factory=list)


class TaskGenerationContext(BaseModel):
    """Context for task generation."""
    weekly_plan_id: int
    week: str  # YYYY-Www
    week_focus: str
    work_items: List[WorkItemPriorityContext] = Field(default_factory=list)
    team_members: List[TeamMemberContext] = Field(default_factory=list)
    focus_priority: Optional[int] = Field(None, description="Focus on specific priority (1, 2, or 3), or None for all")


class TaskSuggestion(BaseModel):
    """AI-generated task suggestion."""
    title: str = Field(..., description="Clear, actionable task title")
    description: str = Field(..., description="Detailed task description")
    work_item_id: int = Field(..., description="ID of the work item this task belongs to")
    assignee_id: Optional[int] = Field(None, description="Suggested team member ID (optional)")
    effort_hours: Optional[int] = Field(None, ge=1, description="Estimated effort in hours")
    rationale: str = Field(..., description="Why this task is needed and how it contributes to the work item")
    dependencies: List[str] = Field(default_factory=list, description="Dependencies or prerequisites")


class TaskGenerationOutput(BaseModel):
    """AI-generated task suggestions."""
    tasks: List[TaskSuggestion] = Field(..., description="List of suggested tasks")
    summary: str = Field(..., description="Summary of the task breakdown")
    estimated_total_effort: str = Field(..., description="Total estimated effort across all tasks")
    assignment_strategy: str = Field(..., description="Strategy for assigning tasks to team members")


class GraphState(TypedDict, total=False):
    """State for task generator LangGraph."""
    task_context: Optional[TaskGenerationContext]
    task_output: Optional[TaskGenerationOutput]
    progress_callback: Optional[Any]  # Callable[[ProgressEvent], None]

