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
    quarter = Column(String(10), nullable=False)  # e.g., "Q1 2026"
    objective = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    team = relationship("Team", back_populates="okrs")
    key_results = relationship("KeyResult", back_populates="okr", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("team_id", "quarter", name="unique_team_quarter"),
        Index("idx_okrs_team_quarter", "team_id", "quarter"),
    )


class KeyResult(Base):
    """Key Results table."""
    __tablename__ = "key_results"

    id = Column(Integer, primary_key=True, index=True)
    okr_id = Column(Integer, ForeignKey("okrs.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=False)
    target_value = Column(DECIMAL(10, 2), nullable=False)
    current_value = Column(DECIMAL(10, 2), default=0)
    unit = Column(String(50))
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    okr = relationship("OKR", back_populates="key_results")

    __table_args__ = (
        Index("idx_key_results_okr", "okr_id"),
    )

