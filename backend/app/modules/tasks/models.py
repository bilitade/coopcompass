"""Task models."""

from sqlalchemy import Column, Integer, Text, String, DateTime, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import Base


def get_utc_now():
    """Get current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)


class Task(Base):
    """Tasks table."""
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    work_item_id = Column(Integer, ForeignKey("work_items.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
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
