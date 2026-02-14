"""WeeklySnapshot model for historical tracking."""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index, JSON, Text
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
    
    # OKR Data (JSON structure to store all KRs and their values)
    okr_data = Column(JSON, nullable=True)  # {"objective": "...", "score": 0.63, "key_results": [{...}]}
    
    # BAU Data (JSON structure to store all activities and their metrics)
    bau_data = Column(JSON, nullable=True)  # {"overall_health": 93.0, "activities": [{...}]}
    
    # Aggregated Scores
    okr_score = Column(String(10), nullable=True)  # "0.63" or "N/A"
    bau_health = Column(String(10), nullable=True)  # "93.0" or "N/A"
    
    created_at = Column(DateTime, default=get_utc_now)

    # Relationships
    team = relationship("Team", foreign_keys=[team_id])

    __table_args__ = (
        Index("idx_snapshots_team_week", "team_id", "week"),
        Index("idx_snapshots_week", "week"),
        Index("idx_snapshots_quarter", "quarter"),
    )

