"""BAU Activity, Metric, and MetricHistory models."""

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
    """BAU Metrics table."""
    __tablename__ = "bau_metrics"

    id = Column(Integer, primary_key=True, index=True)
    bau_activity_id = Column(Integer, ForeignKey("bau_activities.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    target_value = Column(DECIMAL(10, 2), nullable=False)
    current_value = Column(DECIMAL(10, 2), default=0)
    unit = Column(String(50))
    weight = Column(DECIMAL(3, 2), default=1.0)
    is_higher_better = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    bau_activity = relationship("BAUActivity", back_populates="metrics")
    metric_history = relationship("MetricHistory", back_populates="metric", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("weight >= 0 AND weight <= 1"),
        Index("idx_bau_metrics_activity", "bau_activity_id"),
    )


class MetricHistory(Base):
    """Metric History table."""
    __tablename__ = "metric_history"

    id = Column(Integer, primary_key=True, index=True)
    bau_metric_id = Column(Integer, ForeignKey("bau_metrics.id", ondelete="CASCADE"), nullable=False)
    value = Column(DECIMAL(10, 2), nullable=False)
    recorded_at = Column(DateTime, default=get_utc_now)

    # Relationships
    metric = relationship("BAUMetric", back_populates="metric_history")

    __table_args__ = (
        Index("idx_metric_history_metric", "bau_metric_id"),
        Index("idx_metric_history_recorded", "recorded_at"),
    )

