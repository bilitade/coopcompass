"""SQLAlchemy ORM models for the Compass system."""

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, CheckConstraint, UniqueConstraint, Index, Numeric, DECIMAL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

Base = declarative_base()


def get_utc_now():
    """Get current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)


class Department(Base):
    """Departments table."""
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text)
    director_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    teams = relationship("Team", back_populates="department")
    director = relationship("User", foreign_keys=[director_id])

    __table_args__ = (
        Index("idx_departments_name", "name"),
        Index("idx_departments_director", "director_id"),
    )


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
    users = relationship("User", back_populates="team")
    okrs = relationship("OKR", back_populates="team", cascade="all, delete-orphan")
    bau_activities = relationship("BAUActivity", back_populates="team", cascade="all, delete-orphan")
    work_items = relationship("WorkItem", back_populates="team", cascade="all, delete-orphan")


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

    # Relationships
    team = relationship("Team", back_populates="users")
    owned_work_items = relationship("WorkItem", foreign_keys="WorkItem.owner_id", back_populates="owner")
    assigned_tasks = relationship("Task", foreign_keys="Task.assignee_id", back_populates="assignee")

    __table_args__ = (
        CheckConstraint("role IN ('member', 'lead', 'director', 'executive', 'admin')"),
        Index("idx_users_team", "team_id"),
        Index("idx_users_email", "email"),
    )


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


class WorkItem(Base):
    """Work Items table."""
    __tablename__ = "work_items"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    description = Column(Text)
    source_type = Column(String(10), nullable=False)
    source_id = Column(Integer, nullable=False)  # References key_results.id or bau_activities.id
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    month = Column(String(7), nullable=False)  # e.g., "2026-01"
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    team = relationship("Team", back_populates="work_items")
    owner = relationship("User", foreign_keys=[owner_id], back_populates="owned_work_items")
    tasks = relationship("Task", back_populates="work_item", cascade="all, delete-orphan")
    weekly_priorities = relationship("WeeklyPriority", back_populates="work_item", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("source_type IN ('OKR', 'BAU')"),
        Index("idx_work_items_source", "source_type", "source_id"),
        Index("idx_work_items_month", "month"),
        Index("idx_work_items_owner", "owner_id"),
    )


class WeeklyPriority(Base):
    """Weekly Priorities table."""
    __tablename__ = "weekly_priorities"

    id = Column(Integer, primary_key=True, index=True)
    work_item_id = Column(Integer, ForeignKey("work_items.id", ondelete="CASCADE"), nullable=False)
    week = Column(String(8), nullable=False)  # e.g., "2026-W01"
    priority = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    work_item = relationship("WorkItem", back_populates="weekly_priorities")

    __table_args__ = (
        CheckConstraint("priority IN (1, 2, 3)"),
        UniqueConstraint("work_item_id", "week", name="unique_work_item_week"),
        Index("idx_weekly_priorities_week", "week"),
    )


class Task(Base):
    """Tasks table."""
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    work_item_id = Column(Integer, ForeignKey("work_items.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=False)
    assignee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(
        String(20),
        default="Not Started",
        nullable=False
    )
    effort_hours = Column(Integer)
    blocked_reason = Column(Text)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    work_item = relationship("WorkItem", back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_tasks")

    __table_args__ = (
        CheckConstraint("status IN ('Not Started', 'In Progress', 'Done', 'Blocked')"),
        CheckConstraint("effort_hours > 0"),
        Index("idx_tasks_work_item", "work_item_id"),
        Index("idx_tasks_assignee", "assignee_id"),
        Index("idx_tasks_status", "status"),
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

