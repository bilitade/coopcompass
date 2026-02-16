"""OKR and KeyResult models."""

from sqlalchemy import Column, Integer, Text, String, Boolean, DateTime, ForeignKey, UniqueConstraint, Index, DECIMAL
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import Base


def get_utc_now():
    """Get current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)


class OKR(Base):
    """OKRs table."""
    __tablename__ = "okrs"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=True, default=2026)  # e.g., 2025, 2026
    quarters = Column(String(50), nullable=True, default="Q1")  # Comma-separated: "Q1,Q2,Q3" or "Q1" or "Q1,Q2,Q3,Q4"
    okr_level = Column(String(20), nullable=True, default="strategic")  # "strategic", "operational", "tactical"
    objective = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=True, default="draft")  # "draft", "active", "completed"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)
    
    # Legacy quarter field for backward compatibility
    quarter = Column(String(10), nullable=True)  # e.g., "Q1 2026" - kept for backward compatibility

    # Relationships
    team = relationship("Team", back_populates="okrs")
    key_results = relationship("KeyResult", back_populates="okr", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_okrs_team_year", "team_id", "year"),
        Index("idx_okrs_level", "okr_level"),
        Index("idx_okrs_status", "status"),
    )


class KeyResult(Base):
    """Key Results table."""
    __tablename__ = "key_results"

    id = Column(Integer, primary_key=True, index=True)
    okr_id = Column(Integer, ForeignKey("okrs.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=False)
    base_value = Column(DECIMAL(15, 2), nullable=False)  # Starting baseline
    target_value = Column(DECIMAL(15, 2), nullable=False)  # Goal to achieve
    current_value = Column(DECIMAL(15, 2), nullable=False)  # Actual progress (Manager updates weekly)
    unit = Column(String(50), nullable=False)  # customers, Birr, %, count, services, etc.
    weight = Column(DECIMAL(3, 2), nullable=False)  # Importance (0.0-1.0, must sum to 1.0 per Objective)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    okr = relationship("OKR", back_populates="key_results")

    __table_args__ = (
        Index("idx_key_results_okr", "okr_id"),
    )

