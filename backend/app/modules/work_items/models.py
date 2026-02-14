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

    @property
    def month(self):
        return self.monthly_headsup.month if self.monthly_headsup else None

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    monthly_headsup_id = Column(Integer, ForeignKey("monthly_headsups.id", ondelete="CASCADE"), nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text)
    source_type = Column(String(10), nullable=False)  # "OKR" or "BAU"
    source_id = Column(Integer, nullable=False)  # References key_results.id or bau_activities.id
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), default="Not Started", nullable=False)  # Not Started / In Progress / Completed
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    team = relationship("Team", back_populates="work_items")
    monthly_headsup = relationship("MonthlyHeadsUp", back_populates="work_items")
    owner = relationship("User", foreign_keys=[owner_id], back_populates="owned_work_items")
    tasks = relationship("Task", back_populates="work_item", cascade="all, delete-orphan")
    weekly_priorities = relationship("WeeklyPriority", back_populates="work_item", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("source_type IN ('OKR', 'BAU')", name="check_source_type"),
        CheckConstraint("status IN ('Not Started', 'In Progress', 'Completed')", name="check_work_item_status"),
        Index("idx_work_items_source", "source_type", "source_id"),
        Index("idx_work_items_owner", "owner_id"),
        Index("idx_work_items_team", "team_id"),
        Index("idx_work_items_headsup", "monthly_headsup_id"),
    )



