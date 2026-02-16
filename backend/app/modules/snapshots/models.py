"""WeeklySnapshot model for historical tracking."""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index, JSON, Text, DECIMAL, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import Base


def get_utc_now():
    """Get current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)


class WeeklySnapshot(Base):
    """Weekly Snapshots table - Captures comprehensive performance data for report generation."""
    __tablename__ = "weekly_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    week = Column(String(8), nullable=False)  # e.g., "2026-W01" (ISO week format)
    quarter = Column(String(7), nullable=False)  # e.g., "Q1 2026"
    
    # Team Context
    team_name = Column(String(255), nullable=True)
    team_size = Column(Integer, nullable=False, default=0)
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    manager_name = Column(String(255), nullable=True)
    team_members = Column(JSON, nullable=True)  # JSONB: [{"id": 12, "name": "...", "role": "..."}]
    
    # OKR Context & Scores
    okr_id = Column(Integer, ForeignKey("okrs.id", ondelete="SET NULL"), nullable=True)
    okr_objective = Column(Text, nullable=True)
    okr_target_score = Column(DECIMAL(3, 2), nullable=True)  # Target score (usually 0.7)
    okr_current_score = Column(DECIMAL(3, 2), nullable=True)  # Current score (0.0-1.0)
    okr_key_results = Column(JSON, nullable=True)  # JSONB: [{"id": 3, "description": "...", "base": 500000, "target": 750000, "current": 640000, "unit": "customers", "weight": 0.4, "score": 0.56}]
    
    # Legacy fields for backward compatibility (keep for now)
    okr_objective_score = Column(DECIMAL(3, 2), nullable=True)  # Alias for okr_current_score
    kr1_score = Column(DECIMAL(3, 2), nullable=True)
    kr2_score = Column(DECIMAL(3, 2), nullable=True)
    kr3_score = Column(DECIMAL(3, 2), nullable=True)
    kr4_score = Column(DECIMAL(3, 2), nullable=True)
    kr5_score = Column(DECIMAL(3, 2), nullable=True)
    
    # BAU Context & Scores
    bau_activities = Column(JSON, nullable=True)  # JSONB: [{"id": 10, "name": "Branch Operations", "score": 96, "metrics": [...]}]
    bau_overall_health = Column(DECIMAL(5, 2), nullable=True)  # 0-100%
    
    # Legacy field for backward compatibility
    bau_data = Column(JSON, nullable=True)  # Alias for bau_activities
    
    # Work Items (Planned & Completed)
    work_items_planned = Column(JSON, nullable=True)  # JSONB: [{"id": 101, "title": "...", "source_type": "OKR", "source_name": "KR1: ...", "priority": "P1"}]
    work_items_completed = Column(JSON, nullable=True)  # JSONB: Same structure as planned
    work_items_count_planned = Column(Integer, nullable=False, default=0)
    work_items_count_completed = Column(Integer, nullable=False, default=0)
    work_items_completion_rate = Column(DECIMAL(5, 2), nullable=True)  # 0-100%
    
    # Weekly Priority Plan
    weekly_priority_plan = Column(JSON, nullable=True)  # JSONB: {"week_focus": "...", "p1_items": [...], "p2_items": [...], "p3_items": [...]}
    
    # Tasks
    tasks = Column(JSON, nullable=True)  # JSONB: [{"id": 501, "description": "...", "assignee": "Hanna Tesfaye", "status": "Done", "work_item_id": 101}]
    tasks_count_planned = Column(Integer, nullable=False, default=0)
    tasks_count_completed = Column(Integer, nullable=False, default=0)
    tasks_completion_rate = Column(DECIMAL(5, 2), nullable=True)  # 0-100%
    
    # Legacy fields for backward compatibility
    tasks_planned = Column(Integer, nullable=False, default=0)  # Alias for tasks_count_planned
    tasks_completed = Column(Integer, nullable=False, default=0)  # Alias for tasks_count_completed
    
    # Metadata
    snapshot_version = Column(String(10), default='1.0', nullable=False)
    created_at = Column(DateTime, default=get_utc_now)

    # Relationships
    team = relationship("Team", foreign_keys=[team_id])

    __table_args__ = (
        UniqueConstraint("team_id", "week", name="unique_team_week"),
        Index("idx_snapshots_team_quarter", "team_id", "quarter"),
        Index("idx_snapshots_week", "week"),
        Index("idx_snapshots_quarter", "quarter"),
    )

