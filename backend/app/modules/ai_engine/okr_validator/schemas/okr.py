"""Pydantic schemas for OKR validation responses."""
from typing import Any, Dict, List, Literal, Optional, TypedDict

from pydantic import BaseModel, ConfigDict, Field, field_validator


def to_camel(string: str) -> str:
    parts = string.split("_")
    return parts[0] + "".join(word.capitalize() for word in parts[1:]) if len(parts) > 1 else string


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        ser_json_t_by_alias=True,
        ser_json_by_alias=True,
    )


class OKR(CamelModel):
    level: Literal["STRATEGIC", "TACTICAL", "OPERATIONAL"]
    objective: str
    key_results: List[str]


class DimensionFeedback(CamelModel):
    dimension: str = Field(..., description="Criteria name")
    comment: str = Field(..., description="Feedback text")


class ObjectiveRules(CamelModel):
    strategic: float = Field(..., description="Alignment to S.C.A.L.E pillars")
    concrete: float = Field(..., description="No ambiguity, clear end-state")
    action_oriented: float = Field(..., description="Strong verbs")
    linked_to_purpose: float = Field(..., description="Supports Coop purpose")
    emotionally_engaging: float = Field(..., description="Inspiring tone")
    impactful: float = Field(..., description="Transformational change")
    time_bound: float = Field(..., description="Achievable in one cycle")
    positive_feedback: List[DimensionFeedback] = Field(default_factory=list)
    suggestions: List[DimensionFeedback] = Field(default_factory=list)

    @field_validator('time_bound')
    def validate_time_bound(cls, v):
        if v not in [0.0, 0.5, 1.0]:
            raise ValueError("time_bound must be 0.0, 0.5, or 1.0")
        return v


class KRRules(CamelModel):
    concrete: float = Field(..., description="Numeric target + unit")
    leading_lagging: float = Field(..., description="Identifiable as tool/outcome")
    evaluated: float = Field(..., description="Objectively scorable")
    ambitious: float = Field(..., description="Stretch vs baseline")
    real_time_trackable: float = Field(..., description="Frequency > quarterly")
    positive_feedback: List[DimensionFeedback] = Field(default_factory=list)
    suggestions: List[DimensionFeedback] = Field(default_factory=list)

    @field_validator('real_time_trackable')
    def validate_real_time_trackable(cls, v):
        if v not in [0.0, 0.5, 1.0]:
            raise ValueError("real_time_trackable must be 0.0, 0.5, or 1.0")
        return v


class AlignmentResult(CamelModel):
    strength: Literal["Strong", "Partial", "Weak"]
    score: float
    positive_feedback: List[DimensionFeedback] = Field(default_factory=list)
    suggestions: List[DimensionFeedback] = Field(default_factory=list)


class StrategicContext(CamelModel):
    """Strategic alignment context for OKR evaluation against Shift@Scale pillars."""
    pillar: str = Field(..., description="The strategic pillar category")
    strength: Literal["Strong", "Partial", "Weak"]
    score: float
    positive_feedback: List[DimensionFeedback] = Field(default_factory=list, description="Strategic alignment feedback by dimension")
    suggestions: List[DimensionFeedback] = Field(default_factory=list, description="Improvement suggestions for strategic alignment")
    primary_pillar: Optional[str] = Field(None, description="The Shift@Scale pillar this OKR aligns with")


class FrameworkScore(CamelModel):
    percentage: int
    points_display: str


class FrameworkPerformance(CamelModel):
    scale_it: FrameworkScore
    clear: FrameworkScore
    okr_alignment: FrameworkScore
    strategic: FrameworkScore


class ObjectiveCritique(CamelModel):
    text: str
    level: str
    scores: Dict[str, float]
    suggestions: Dict[str, str]
    feedback: Dict[str, str]


class KRCritique(CamelModel):
    kr_id: str
    text: str
    scores: Dict[str, float]
    suggestions: Dict[str, str]
    feedback: Dict[str, str]


class ValidationReport(CamelModel):
    overall_health_score: int
    decision: Literal["PASS", "FAIL", "CONDITIONAL PASS"]
    strategic_context: StrategicContext
    framework_performance: FrameworkPerformance
    improvement_areas_count: int
    objective_analysis: ObjectiveCritique
    key_results_analysis: List[KRCritique]


class EntityImprovement(CamelModel):
    entity: str = Field(..., description="Entity name (objective, kr1, kr2, kr3)")
    improvements: List[str] = Field(default_factory=list, description="List of improvements for this entity")


class CorrectionOutput(CamelModel):
    objective: str
    key_results: List[str]
    summary: str
    improvements: List[EntityImprovement]


class GraphState(TypedDict, total=False):
    raw_input: str
    strategy: Optional[str]
    okr: Optional[OKR]
    objective_rules: Optional[ObjectiveRules]
    kr_rules: Optional[List[KRRules]]
    okr_alignment: Optional[AlignmentResult]
    strategy_alignment: Optional[StrategicContext]
    report: Optional[ValidationReport]
    corrected: Optional[bool]
    correction_summary: Optional[str]
    improvement: Optional[Dict[str, List[str]]]
    progress_callback: Optional[Any]  # Callable[[ProgressEvent], None]