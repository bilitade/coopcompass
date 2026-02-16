"""High-level orchestrators for OKR validation and correction."""
from functools import lru_cache
from typing import TYPE_CHECKING, Callable, Optional

from app.core.logging_config import logger
from app.modules.ai_engine.okr_validator.prompts.templates import DEFAULT_STRATEGY_DIRECTIVE
from app.modules.ai_engine.okr_validator.schemas.okr import GraphState, OKR, ValidationReport
from app.modules.ai_engine.okr_validator.schemas.progress import ProgressEvent, ProgressEventType
from app.modules.ai_engine.okr_validator.services.graph import build_corrector_graph, build_validator_graph
from app.modules.ai_engine.okr_validator.services.scoring import calculate_final_score

if TYPE_CHECKING:
    from app.modules.ai_engine.okr_validator.api_schemas import CorrectionResponse, ValidateResponse


@lru_cache
def _validator_graph():
    return build_validator_graph()


@lru_cache
def _corrector_graph():
    return build_corrector_graph()


def run_validation(
    raw_input: str,
    progress_callback: Optional[Callable[[ProgressEvent], None]] = None,
):
    """Run validation with optional progress callback."""
    from app.modules.ai_engine.okr_validator.api_schemas import ValidateResponse
    
    logger.info("Starting validation workflow")
    
    state: GraphState = {
        "raw_input": raw_input,
        "strategy": DEFAULT_STRATEGY_DIRECTIVE,
        "progress_callback": progress_callback,
    }
    
    state = _validator_graph().invoke(state)

    report = _build_report(state)
    
    if progress_callback:
        progress_callback(
            ProgressEvent(
                event_type=ProgressEventType.COMPLETE,
                step_id="complete",
                step_name="Validation Complete",
                step_number=5,
                total_steps=5,
                message="Validation workflow completed successfully",
            )
        )
    
    logger.info("Validation workflow completed")
    return ValidateResponse(
        okr=state["okr"],
        objective_rules=state["objective_rules"],
        kr_rules=state["kr_rules"],
        okr_alignment=state["okr_alignment"],
        strategy_alignment=state["strategy_alignment"],
        report=report,
    )


def run_correction(
    okr: OKR,
    report: ValidationReport,
    progress_callback: Optional[Callable[[ProgressEvent], None]] = None,
):
    """Run correction with optional progress callback."""
    from app.modules.ai_engine.okr_validator.api_schemas import CorrectionResponse
    
    logger.info("Starting correction workflow")
    
    # Create state with validation data for targeted correction
    state: GraphState = {
        "okr": okr,
        "report": report,
        "strategy": DEFAULT_STRATEGY_DIRECTIVE,
        "progress_callback": progress_callback,
    }
    
    # Run correction
    correction_result = _corrector_graph().invoke(state)
    
    if progress_callback:
        progress_callback(
            ProgressEvent(
                event_type=ProgressEventType.COMPLETE,
                step_id="complete",
                step_name="Correction Complete",
                step_number=1,
                total_steps=1,
                message="Correction workflow completed successfully",
            )
        )
    
    logger.info("Correction workflow completed")
    return CorrectionResponse(
        original_okr=okr,
        corrected_okr=correction_result["okr"],
        correction_summary=correction_result["correction_summary"],
        improvement=correction_result["improvement"]
    )


def _build_report(state: GraphState) -> ValidationReport:
    return calculate_final_score(
        state["objective_rules"],
        state["kr_rules"],
        state["strategy_alignment"],
        state["okr_alignment"],
        state["okr"],
    )


def _format_raw_input(okr: OKR) -> str:
    key_results = "\n".join(okr.key_results)
    return f"Objective: {okr.objective}\nKey Results:\n{key_results}"
