"""Calculation utilities for OKR and BAU scoring per Compass Specification."""

from datetime import datetime, date
from decimal import Decimal
from typing import List, Dict


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


def calculate_kr_score(base_value: Decimal, target_value: Decimal, current_value: Decimal) -> float:
    """
    Calculate Key Result score based on the formula from spec:
    KR Score = (current - base) / (target - base)
    Capped between 0.0 and 1.0
    
    Args:
        base_value: Starting baseline value
        target_value: Goal value to achieve
        current_value: Actual current progress
    
    Returns:
        Score between 0.0 and 1.0
    """
    base = float(base_value)
    target = float(target_value)
    current = float(current_value)
    
    # Handle edge case where target equals base
    if target == base:
        return 1.0 if current >= target else 0.0
    
    # Calculate score
    score = (current - base) / (target - base)
    
    # Clamp to [0.0, 1.0]
    return max(0.0, min(1.0, score))


def calculate_objective_score(key_results: List[Dict]) -> float:
    """
    Calculate Objective score based on the formula from spec:
    Objective Score = SUM(KR Score × KR Weight)
    
    Args:
        key_results: List of dicts with 'score' and 'weight' keys
    
    Returns:
        Score between 0.0 and 1.0
    """
    if not key_results:
        return 0.0
    
    weighted_sum = sum(
        kr['score'] * float(kr['weight'])
        for kr in key_results
    )
    
    return round(weighted_sum, 3)


def get_okr_status(score: float) -> str:
    """
    Get OKR status band based on score.
    
    Args:
        score: Objective score (0.0 to 1.0)
    
    Returns:
        Status: "Green", "Yellow", or "Red"
    """
    if score >= 0.7:
        return "Green"
    elif score >= 0.4:
        return "Yellow"
    else:
        return "Red"


def calculate_bau_metric_achievement(
    target_value: Decimal,
    current_value: Decimal,
    metric_type: str
) -> float:
    """
    Calculate BAU metric achievement based on the formula from spec:
    
    IF type = "higher_better":
        Achievement = (current / target) × 100, capped at 100
    
    IF type = "lower_better":
        Achievement = (target / current) × 100, capped at 100
    
    Args:
        target_value: Goal value
        current_value: Actual value
        metric_type: "higher_better" or "lower_better"
    
    Returns:
        Achievement percentage (0-100)
    """
    target = float(target_value)
    current = float(current_value)
    
    # Avoid division by zero
    if target == 0 or current == 0:
        return 0.0
    
    if metric_type == "Higher is Better":
        achievement = (current / target) * 100
    else:  # lower_better
        achievement = (target / current) * 100
    
    # Cap at 100%
    return min(achievement, 100.0)


def calculate_bau_activity_score(metrics: List[Dict]) -> float:
    """
    Calculate BAU Activity score based on the formula from spec:
    Activity Score = SUM(Metric Achievement × Metric Weight)
    
    Args:
        metrics: List of dicts with 'achievement' and 'weight' keys
    
    Returns:
        Score between 0-100%
    """
    if not metrics:
        return 0.0
    
    weighted_sum = sum(
        metric['achievement'] * float(metric['weight'])
        for metric in metrics
    )
    
    return round(weighted_sum, 2)


def calculate_bau_overall_health(activities: List[Dict]) -> float:
    """
    Calculate overall BAU health based on the formula from spec:
    BAU Health = AVERAGE(All BAU Activity Scores for team)
    
    Args:
        activities: List of dicts with 'score' key
    
    Returns:
        Health percentage (0-100%)
    """
    if not activities:
        return 0.0
    
    total_score = sum(activity['score'] for activity in activities)
    avg_health = total_score / len(activities)
    
    return round(avg_health, 2)


def get_bau_status(score: float) -> str:
    """
    Get BAU status band based on score.
    
    Args:
        score: BAU health score (0-100%)
    
    Returns:
        Status: "Excellent", "Good", "Acceptable", "Warning", or "Poor"
    """
    if score >= 95:
        return "Excellent"
    elif score >= 90:
        return "Good"
    elif score >= 85:
        return "Acceptable"
    elif score >= 80:
        return "Warning"
    else:
        return "Poor"


def validate_weights_sum_to_one(weights: List[Decimal], tolerance: float = 0.01) -> bool:
    """
    Validate that weights sum to 1.0 (with small tolerance for floating point errors).
    
    Args:
        weights: List of weight values
        tolerance: Acceptable deviation from 1.0
    
    Returns:
        True if weights sum to ~1.0, False otherwise
    """
    total = sum(float(w) for w in weights)
    return abs(total - 1.0) <= tolerance

