"""Shared calculation utilities."""

from datetime import datetime, date


def get_current_quarter() -> str:
    """Get current quarter in Q# YYYY format."""
    now = datetime.utcnow()
    quarter = (now.month - 1) // 3 + 1
    return f"Q{quarter} {now.year}"


def get_current_week() -> str:
    """Get current week in YYYY-W## format."""
    today = date.today()
    iso_calendar = today.isocalendar()
    return f"{iso_calendar[0]}-W{iso_calendar[1]:02d}"

