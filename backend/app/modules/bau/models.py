"""BAU Activity and Metric models."""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, CheckConstraint, Index, DECIMAL
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import Base


def get_utc_now():
    """Get current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)


class BAUActivity(Base):
    """BAU Activities table."""
    __tablename__ = "bau_activities"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    team = relationship("Team", back_populates="bau_activities")
    metrics = relationship("BAUMetric", back_populates="bau_activity", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_bau_activities_team", "team_id"),
    )


class BAUMetric(Base):
    """BAU Metrics table (KPIs)."""
    __tablename__ = "bau_metrics"

    id = Column(Integer, primary_key=True, index=True)
    bau_activity_id = Column(Integer, ForeignKey("bau_activities.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    target_value = Column(DECIMAL(15, 2), nullable=False)  # Goal value
    current_value = Column(DECIMAL(15, 2), nullable=False, default=0)  # Actual value (Manager updates weekly)
    unit = Column(String(50), nullable=False)  # %, minutes, hours, count, etc.
    weight = Column(DECIMAL(3, 2), nullable=False)  # Importance (0.0-1.0, must sum to 1.0 per Activity)
    metric_type = Column(String(20), nullable=False, default="Higher is Better")  # "Higher is Better" OR "Lower is Better"
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    bau_activity = relationship("BAUActivity", back_populates="metrics")

    __table_args__ = (
        CheckConstraint("weight >= 0 AND weight <= 1", name="check_weight_range"),
        CheckConstraint("metric_type IN ('Higher is Better', 'Lower is Better')", name="check_metric_type"),
        Index("idx_bau_metrics_activity", "bau_activity_id"),
    )


