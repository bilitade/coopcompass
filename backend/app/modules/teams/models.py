"""Team model."""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import Base


def get_utc_now():
    """Get current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)


class Team(Base):
    """Teams table."""
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    department = relationship("Department", back_populates="teams")
    users = relationship("User", back_populates="team", foreign_keys="User.team_id")
    okrs = relationship("OKR", back_populates="team", cascade="all, delete-orphan")
    bau_activities = relationship("BAUActivity", back_populates="team", cascade="all, delete-orphan")
    work_items = relationship("WorkItem", back_populates="team", cascade="all, delete-orphan")
    monthly_headsups = relationship("MonthlyHeadsUp", back_populates="team", cascade="all, delete-orphan")

