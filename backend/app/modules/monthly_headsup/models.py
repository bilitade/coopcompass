"""Monthly Heads-Up models."""

from sqlalchemy import Column, Integer, Text, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import Base


def get_utc_now():
    """Get current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)


class MonthlyHeadsUp(Base):
    """Monthly Heads-Up table."""
    __tablename__ = "monthly_headsups"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    month = Column(String(7), nullable=False)  # "YYYY-MM"
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    team = relationship("Team", back_populates="monthly_headsups")
    work_items = relationship("WorkItem", back_populates="monthly_headsup", cascade="all, delete-orphan")
    weekly_priority_plans = relationship("WeeklyPriorityPlan", back_populates="monthly_headsup", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_monthly_headsups_team", "team_id"),
        Index("idx_monthly_headsups_month", "month"),
    )
