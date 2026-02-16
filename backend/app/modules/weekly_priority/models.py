"""Weekly Priority and Weekly Priority Plan models."""

from sqlalchemy import Column, Integer, Text, String, DateTime, ForeignKey, CheckConstraint, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import Base


def get_utc_now():
    """Get current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)


class WeeklyPriorityPlan(Base):
    """Weekly Priority Plans table."""
    __tablename__ = "weekly_priority_plans"

    id = Column(Integer, primary_key=True, index=True)
    monthly_headsup_id = Column(Integer, ForeignKey("monthly_headsups.id", ondelete="CASCADE"), nullable=False)
    week = Column(String(8), nullable=False)  # "YYYY-Www"
    week_focus = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    monthly_headsup = relationship("MonthlyHeadsUp", back_populates="weekly_priority_plans")
    priorities = relationship("WeeklyPriority", back_populates="plan", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_weekly_priority_plans_headsup", "monthly_headsup_id"),
        Index("idx_weekly_priority_plans_week", "week"),
        UniqueConstraint("monthly_headsup_id", "week", name="unique_headsup_week"),
    )


class WeeklyPriority(Base):
    """Weekly Priorities table."""
    __tablename__ = "weekly_priorities"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("weekly_priority_plans.id", ondelete="CASCADE"), nullable=False)
    work_item_id = Column(Integer, ForeignKey("work_items.id", ondelete="CASCADE"), nullable=False)
    priority = Column(Integer, nullable=False)  # 1 (P1), 2 (P2), 3 (P3)
    created_at = Column(DateTime, default=get_utc_now)

    # Relationships
    plan = relationship("WeeklyPriorityPlan", back_populates="priorities")
    work_item = relationship("WorkItem", back_populates="weekly_priorities")

    __table_args__ = (
        CheckConstraint("priority IN (1, 2, 3)"),
        UniqueConstraint("plan_id", "work_item_id", name="unique_plan_work_item"),
        Index("idx_weekly_priorities_plan", "plan_id"),
        Index("idx_weekly_priorities_work_item", "work_item_id"),
    )
