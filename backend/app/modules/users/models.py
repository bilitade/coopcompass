"""User model."""

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, CheckConstraint, Index, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import Base


def get_utc_now():
    """Get current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)


class User(Base):
    """Users table."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    position = Column(String(255), nullable=True)
    role = Column(String(50), nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships (will be set up after other models are imported)
    team = relationship("Team", back_populates="users", foreign_keys=[team_id])
    owned_work_items = relationship("WorkItem", foreign_keys="WorkItem.owner_id", back_populates="owner")
    assigned_tasks = relationship("Task", foreign_keys="Task.assignee_id", back_populates="assignee")

    __table_args__ = (
        CheckConstraint("role IN ('member', 'lead', 'director', 'executive', 'admin')"),
        Index("idx_users_team", "team_id"),
        Index("idx_users_email", "email"),
    )

