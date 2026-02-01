"""Backward compatibility shim for dependencies imports."""

from app.api.v1.deps import (
    get_current_user,
    get_current_team_lead,
    get_current_executive,
)

__all__ = [
    "get_current_user",
    "get_current_team_lead",
    "get_current_executive",
]
