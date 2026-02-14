"""WorkItem, Task, and WeeklyPriority models."""

from sqlalchemy import Column, Integer, Text, String, DateTime, ForeignKey, CheckConstraint, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import Base


def get_utc_now():
    """Get current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)


class WorkItem(Base):
    """Work Items table."""
    __tablename__ = "work_items"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text)
    source_type = Column(String(10), nullable=False)  # "OKR" or "BAU"
    source_id = Column(Integer, nullable=False)  # References key_results.id or bau_activities.id
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    month = Column(String(7), nullable=False)  # e.g., "2026-01"
    status = Column(String(20), default="Not Started", nullable=False)  # Not Started / In Progress / Completed
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    team = relationship("Team", back_populates="work_items")
    owner = relationship("User", foreign_keys=[owner_id], back_populates="owned_work_items")
    tasks = relationship("Task", back_populates="work_item", cascade="all, delete-orphan")
    weekly_priorities = relationship("WeeklyPriority", back_populates="work_item", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("source_type IN ('OKR', 'BAU')", name="check_source_type"),
        CheckConstraint("status IN ('Not Started', 'In Progress', 'Completed')", name="check_work_item_status"),
        Index("idx_work_items_source", "source_type", "source_id"),
        Index("idx_work_items_month", "month"),
        Index("idx_work_items_owner", "owner_id"),
        Index("idx_work_items_team", "team_id"),
    )


class WeeklyPriority(Base):
    """Weekly Priorities table."""
    __tablename__ = "weekly_priorities"

    id = Column(Integer, primary_key=True, index=True)
    work_item_id = Column(Integer, ForeignKey("work_items.id", ondelete="CASCADE"), nullable=False)
    week = Column(String(8), nullable=False)  # e.g., "2026-W01"
    priority = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    work_item = relationship("WorkItem", back_populates="weekly_priorities")

    __table_args__ = (
        CheckConstraint("priority IN (1, 2, 3)"),
        UniqueConstraint("work_item_id", "week", name="unique_work_item_week"),
        Index("idx_weekly_priorities_week", "week"),
    )


class Task(Base):
    """Tasks table."""
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    work_item_id = Column(Integer, ForeignKey("work_items.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=False)
    assignee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(
        String(20),
        default="Not Started",
        nullable=False
    )
    effort_hours = Column(Integer)
    blocked_reason = Column(Text)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    work_item = relationship("WorkItem", back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_tasks")

    __table_args__ = (
        CheckConstraint("status IN ('Not Started', 'In Progress', 'Done', 'Blocked')"),
        CheckConstraint("effort_hours > 0"),
        Index("idx_tasks_work_item", "work_item_id"),
        Index("idx_tasks_assignee", "assignee_id"),
        Index("idx_tasks_status", "status"),
    )

