"""Request/response schemas for v1 OKR endpoints."""
from typing import Any, Dict, List
from pydantic import Field
from app.modules.ai_engine.okr_validator.schemas.okr import AlignmentResult, CamelModel, KRRules, OKR, ObjectiveRules, StrategicContext, ValidationReport


class ValidateRequest(CamelModel):
    raw_input: str


class ValidateResponse(CamelModel):
    okr: OKR
    objective_rules: ObjectiveRules
    kr_rules: List[KRRules]
    okr_alignment: AlignmentResult
    strategy_alignment: StrategicContext 
    report: ValidationReport


class CorrectionRequest(CamelModel):
    okr: OKR
    report: ValidationReport


class CorrectionResponse(CamelModel):
    """Response schema for OKR correction endpoint."""
    original_okr: OKR = Field(..., description="The original OKR that was submitted for correction")
    corrected_okr: OKR = Field(..., description="The improved version of the OKR")
    correction_summary: str = Field(..., description="Summary of what was changed and why")
    improvement: Dict[str, List[str]] = Field(default_factory=dict, description="Improvements organized by entity (objective, kr1, kr2, kr3)")
