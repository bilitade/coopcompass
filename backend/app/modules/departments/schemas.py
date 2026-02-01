"""Department schemas."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from app.modules.users.schemas import UserResponse

if TYPE_CHECKING:
    from app.modules.teams.schemas import TeamResponse


class DepartmentCreate(BaseModel):
    """Department creation schema."""
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    director_id: Optional[int] = None


class DepartmentUpdate(BaseModel):
    """Department update schema."""
    name: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    director_id: Optional[int] = None


class DepartmentResponse(BaseModel):
    """Department response schema."""
    id: int
    name: str
    description: Optional[str]
    director_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DepartmentDetailResponse(DepartmentResponse):
    """Department detail response with teams and director info."""
    teams: List['TeamResponse'] = []
    director: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# Import TeamResponse at runtime for forward reference resolution
# This is done after class definitions to avoid circular imports
# We use a try-except to handle the case where teams module hasn't loaded yet
try:
    from app.modules.teams.schemas import TeamResponse
except ImportError:
    # Will be resolved later when all modules are loaded
    pass

