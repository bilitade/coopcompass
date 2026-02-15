"""Scoring utilities for OKR validation."""
from typing import List

from app.modules.ai_engine.okr_validator.schemas.okr import (
    AlignmentResult,
    FrameworkPerformance,
    FrameworkScore,
    KRCritique,
    KRRules,
    ObjectiveCritique,
    ObjectiveRules,
    StrategicContext,
    ValidationReport,
    OKR,
)


def score_objective(rules: ObjectiveRules) -> float:
    """Score the objective using S.C.A.L.E.I.T weights (max 40)."""
    return (
        rules.strategic * 8
        + rules.concrete * 6
        + rules.action_oriented * 5
        + rules.linked_to_purpose * 5
        + rules.emotionally_engaging * 5
        + rules.impactful * 6
        + rules.time_bound * 5
    )


def score_krs(kr_rules: List[KRRules]) -> float:
    """Score key results using C.L.E.A.R weights (max 27 before normalization)."""
    if not kr_rules:
        return 0.0

    total = 0.0
    for kr in kr_rules:
        total += (
            kr.concrete * 7
            + kr.leading_lagging * 5
            + kr.evaluated * 5
            + kr.ambitious * 5
            + kr.real_time_trackable * 5
        )

    return total / len(kr_rules)


def calculate_final_score(
    obj_rules: ObjectiveRules,
    kr_rules: List[KRRules],
    strategy_alignment: StrategicContext,
    okr_alignment: AlignmentResult,
    okr: OKR,
) -> ValidationReport:
    """Aggregate framework scoring into a detailed validation report."""

    obj_base = score_objective(obj_rules)

    total_kr_base = 0.0
    for kr in kr_rules:
        total_kr_base += (
            kr.concrete * 7
            + kr.leading_lagging * 5
            + kr.evaluated * 5
            + kr.ambitious * 5
            + kr.real_time_trackable * 5
        )

    kr_avg = (total_kr_base / len(kr_rules)) if kr_rules else 0.0
    kr_quality_pts = kr_avg * (30.0 / 27.0) if kr_rules else 0.0
    kr_quality_pts = min(30.0, kr_quality_pts)

    internal_align_pts = okr_alignment.score * 10.0
    strat_align_pts = strategy_alignment.score * 20.0

    clear_pts = kr_quality_pts
    total_raw = obj_base + clear_pts + internal_align_pts + strat_align_pts

    reasons = []
    is_auto_fail = False

    if obj_rules.strategic == 0:
        reasons.append("Objective has no strategic alignment")
        is_auto_fail = True
    if not (2 <= len(kr_rules) <= 5):
        reasons.append(f"Invalid KR count: {len(kr_rules)}")
        is_auto_fail = True
    if strategy_alignment.strength == "Weak":
        reasons.append("Weak OKR-Strategy alignment")
        is_auto_fail = True

    final_total = total_raw
    if is_auto_fail:
        final_total = min(total_raw, 79.0)

    decision = "PASS" if final_total >= 90 else ("CONDITIONAL PASS" if final_total >= 80 else "FAIL")

    improvement_count = 0
    obj_dims = [
        obj_rules.strategic,
        obj_rules.concrete,
        obj_rules.action_oriented,
        obj_rules.linked_to_purpose,
        obj_rules.emotionally_engaging,
        obj_rules.impactful,
        obj_rules.time_bound,
    ]
    improvement_count += sum(1 for d in obj_dims if d < 1.0)
    for kr in kr_rules:
        kr_dims = [
            kr.concrete,
            kr.leading_lagging,
            kr.evaluated,
            kr.ambitious,
            kr.real_time_trackable,
        ]
        improvement_count += sum(1 for d in kr_dims if d < 1.0)
    if okr_alignment.score < 1.0:
        improvement_count += 1
    if strategy_alignment.score < 1.0:
        improvement_count += 1

    framework = FrameworkPerformance(
        scale_it=FrameworkScore(
            percentage=int((obj_base / 40) * 100),
            points_display=f"{round(obj_base, 1)}/40",
        ),
        clear=FrameworkScore(
            percentage=int((clear_pts / 30) * 100),
            points_display=f"{round(clear_pts, 1)}/30",
        ),
        okr_alignment=FrameworkScore(
            percentage=int((internal_align_pts / 10) * 100),
            points_display=f"{round(internal_align_pts, 1)}/10",
        ),
        strategic=FrameworkScore(
            percentage=int((strat_align_pts / 20) * 100),
            points_display=f"{round(strat_align_pts, 1)}/20",
        ),
    )

    objective_analysis = ObjectiveCritique(
        text=okr.objective,
        level=okr.level,
        scores={
            "Strategic": round(obj_rules.strategic, 2),
            "Concrete": round(obj_rules.concrete, 2),
            "Action-Oriented": round(obj_rules.action_oriented, 2),
            "Linked to Purpose": round(obj_rules.linked_to_purpose, 2),
            "Emotionally Engaging": round(obj_rules.emotionally_engaging, 2),
            "Impactful": round(obj_rules.impactful, 2),
            "Time-bound": round(obj_rules.time_bound, 2),
        },
        suggestions={item.dimension: item.comment for item in obj_rules.suggestions},
        feedback={item.dimension: item.comment for item in obj_rules.positive_feedback},
    )

    key_results_analysis = [
        KRCritique(
            kr_id=f"KR{i + 1}",
            text=okr.key_results[i],
            scores={
                "Concrete": round(kr.concrete, 2),
                "Leading/Lagging": round(kr.leading_lagging, 2),
                "Evaluated (Scorable)": round(kr.evaluated, 2),
                "Ambitious": round(kr.ambitious, 2),
                "Real-Time Trackable": round(kr.real_time_trackable, 2),
            },
            suggestions={item.dimension: item.comment for item in kr.suggestions},
            feedback={item.dimension: item.comment for item in kr.positive_feedback},
        )
        for i, kr in enumerate(kr_rules)
    ]

    return ValidationReport(
        overall_health_score=int(final_total),
        decision=decision,
        strategic_context=StrategicContext(
            pillar=strategy_alignment.pillar,
            strength=strategy_alignment.strength,
            score=strategy_alignment.score,
            positive_feedback=strategy_alignment.positive_feedback,
            suggestions=strategy_alignment.suggestions,
        ),
        framework_performance=framework,
        improvement_areas_count=improvement_count,
        objective_analysis=objective_analysis,
        key_results_analysis=key_results_analysis,
    )