"""WeeklySnapshot model for historical tracking."""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index, JSON, Text, DECIMAL, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import Base


def get_utc_now():
    """Get current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)


class WeeklySnapshot(Base):
    """Weekly Snapshots table - Captures all scores and values weekly."""
    __tablename__ = "weekly_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    week = Column(String(8), nullable=False)  # e.g., "2026-W01" (ISO week format)
    quarter = Column(String(10), nullable=False)  # e.g., "Q1 2026"
    
    # Outcomes - OKR
    okr_objective_score = Column(DECIMAL(3, 2), nullable=True)  # 0.0-1.0
    kr1_score = Column(DECIMAL(3, 2), nullable=True)
    kr2_score = Column(DECIMAL(3, 2), nullable=True)
    kr3_score = Column(DECIMAL(3, 2), nullable=True)
    kr4_score = Column(DECIMAL(3, 2), nullable=True)
    kr5_score = Column(DECIMAL(3, 2), nullable=True)
    
    # Outcomes - BAU
    bau_overall_health = Column(DECIMAL(5, 2), nullable=True)  # 0-100%
    
    # Work Item Execution
    work_items_planned = Column(Integer, nullable=False, default=0)
    work_items_completed = Column(Integer, nullable=False, default=0)
    work_items_completion_rate = Column(DECIMAL(5, 2), nullable=True)  # 0-100%
    
    # Task Execution
    tasks_planned = Column(Integer, nullable=False, default=0)
    tasks_completed = Column(Integer, nullable=False, default=0)
    tasks_completion_rate = Column(DECIMAL(5, 2), nullable=True)  # 0-100%
    
    # Context
    team_size = Column(Integer, nullable=False, default=0)
    
    # Detailed data stored as JSON for flexibility
    okr_data = Column(JSON, nullable=True)  # Full OKR details
    bau_data = Column(JSON, nullable=True)  # Full BAU details
    
    created_at = Column(DateTime, default=get_utc_now)

    # Relationships
    team = relationship("Team", foreign_keys=[team_id])

    __table_args__ = (
        UniqueConstraint("team_id", "week", name="unique_team_week"),
        Index("idx_snapshots_team_quarter", "team_id", "quarter"),
        Index("idx_snapshots_week", "week"),
        Index("idx_snapshots_quarter", "quarter"),
    )

