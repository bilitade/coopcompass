"""Progress event schemas for streaming updates."""
from enum import Enum
from typing import Optional

from pydantic import BaseModel


class ProgressEventType(str, Enum):
    """Types of progress events."""
    STEP_START = "step_start"
    STEP_COMPLETE = "step_complete"
    STEP_ERROR = "step_error"
    PROGRESS = "progress"
    COMPLETE = "complete"


class ProgressEvent(BaseModel):
    """Progress event for streaming updates."""
    event_type: ProgressEventType
    step_id: str
    step_name: str
    step_number: int
    total_steps: int
    message: Optional[str] = None
    error: Optional[str] = None
    data: Optional[dict] = None

