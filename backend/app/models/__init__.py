"""Database models - centralized imports for SQLAlchemy relationships."""

# Import all models so SQLAlchemy relationships work correctly
from app.modules.users.models import User
from app.modules.teams.models import Team
from app.modules.departments.models import Department
from app.modules.okrs.models import OKR, KeyResult
from app.modules.bau.models import BAUActivity, BAUMetric
from app.modules.monthly_headsup.models import MonthlyHeadsUp
from app.modules.weekly_priority.models import WeeklyPriority, WeeklyPriorityPlan
from app.modules.work_items.models import WorkItem
from app.modules.tasks.models import Task
from app.modules.snapshots.models import WeeklySnapshot

# Export Base for migrations
from app.models.base import Base

# Export all models for easy access
__all__ = [
    "Base",
    "User",
    "Team",
    "Department",
    "OKR",
    "KeyResult",
    "BAUActivity",
    "BAUMetric",
    "MonthlyHeadsUp",
    "WeeklyPriorityPlan",
    "WeeklyPriority",
    "WorkItem",
    "Task",
    "WeeklySnapshot",
]


