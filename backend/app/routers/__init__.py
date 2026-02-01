"""Backward compatibility shim for router imports."""

# Import routers from modules for backward compatibility
from app.modules.auth.routers import router as auth
from app.modules.users.routers import router as users
from app.modules.teams.routers import router as teams
from app.modules.departments.routers import router as departments
from app.modules.okrs.routers import router as okrs
from app.modules.bau.routers import router as bau
from app.modules.work_items.routers import router as work_items
from app.modules.weekly_priority.routers import router as weekly_priority

__all__ = [
    "auth",
    "users",
    "teams",
    "departments",
    "okrs",
    "bau",
    "work_items",
    "weekly_priority",
]
