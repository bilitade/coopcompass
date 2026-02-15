"""LangChain node implementations for the OKR validation workflow."""
from pprint import pprint
from typing import Callable, Optional

from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.core.logging_config import logger
from app.modules.ai_engine.okr_validator.prompts.templates import (
    CORRECTION_PROMPT,
    DEFAULT_STRATEGY_DIRECTIVE,
    EXTRACT_OKR_PROMPT,
    KR_RULES_PROMPT,
    OBJECTIVE_RULES_PROMPT,
    OKR_ALIGNMENT_PROMPT,
    STRATEGY_ALIGNMENT_PROMPT,
    SHIFT_AT_SCALE_COMPACT,
)
from app.modules.ai_engine.okr_validator.schemas.okr import AlignmentResult, CorrectionOutput, GraphState, KRRules, OKR, ObjectiveRules, StrategicContext
from app.modules.ai_engine.okr_validator.schemas.progress import ProgressEvent, ProgressEventType

load_dotenv()

def get_llm_mini():
    """Get GPT-4o-mini model instance."""
    return ChatOpenAI(model="gpt-4o-mini", temperature=0)

def get_llm_strong():
    """Get GPT-4o model instance."""
    return ChatOpenAI(model="gpt-4o", temperature=0)


def _emit_progress(
    progress_callback: Optional[Callable[[ProgressEvent], None]],
    event_type: ProgressEventType,
    step_id: str,
    step_name: str,
    step_number: int,
    total_steps: int,
    message: Optional[str] = None,
    error: Optional[str] = None,
    data: Optional[dict] = None,
):
    """Helper function to emit progress events."""
    if progress_callback:
        event = ProgressEvent(
            event_type=event_type,
            step_id=step_id,
            step_name=step_name,
            step_number=step_number,
            total_steps=total_steps,
            message=message,
            error=error,
            data=data,
        )
        progress_callback(event)


def extract_okr(state: GraphState):
    progress_callback = state.get("progress_callback")
    step_number = 1
    total_steps = 5
    
    logger.info(f"[EXTRACT] Starting OKR extraction from raw input")
    _emit_progress(
        progress_callback,
        ProgressEventType.STEP_START,
        "extract",
        "Extract OKR",
        step_number,
        total_steps,
        "Parsing OKR text and extracting structured data",
    )
    
    try:
        print(f"\n>>> [NODE: EXTRACT] Input: {state['raw_input']}")
        prompt = ChatPromptTemplate.from_template(EXTRACT_OKR_PROMPT)
        chain = prompt | get_llm_mini().with_structured_output(OKR)
        okr = chain.invoke({"input": state["raw_input"]})
        print("<<< [NODE: EXTRACT] Output:")
        pprint(okr.model_dump())
        
        logger.info(f"[EXTRACT] Successfully extracted OKR: {okr.objective}")
        _emit_progress(
            progress_callback,
            ProgressEventType.STEP_COMPLETE,
            "extract",
            "Extract OKR",
            step_number,
            total_steps,
            f"Extracted OKR: {okr.objective}",
            data={"okr": okr.model_dump()},
        )
        
        return {"okr": okr}
    except Exception as e:
        logger.error(f"[EXTRACT] Error: {str(e)}", exc_info=True)
        _emit_progress(
            progress_callback,
            ProgressEventType.STEP_ERROR,
            "extract",
            "Extract OKR",
            step_number,
            total_steps,
            error=str(e),
        )
        raise


def validate_objective(state: GraphState):
    progress_callback = state.get("progress_callback")
    step_number = 2
    total_steps = 5
    
    logger.info(f"[VALIDATE_OBJECTIVE] Validating objective: {state['okr'].objective}")
    _emit_progress(
        progress_callback,
        ProgressEventType.STEP_START,
        "objective_rules",
        "Validate Objectives",
        step_number,
        total_steps,
        "Evaluating objective against governance rules",
    )
    
    try:
        print(f"\n>>> [NODE: VALIDATE_OBJECTIVE] Input: {state['okr'].objective}")
        prompt = ChatPromptTemplate.from_template(OBJECTIVE_RULES_PROMPT)
        chain = prompt | get_llm_mini().with_structured_output(ObjectiveRules)
        rules = chain.invoke({"objective": state["okr"].objective, "pillars": SHIFT_AT_SCALE_COMPACT})
        print("<<< [NODE: VALIDATE_OBJECTIVE] Output:")
        pprint(rules.model_dump())
        
        logger.info(f"[VALIDATE_OBJECTIVE] Objective validation complete")
        _emit_progress(
            progress_callback,
            ProgressEventType.STEP_COMPLETE,
            "objective_rules",
            "Validate Objectives",
            step_number,
            total_steps,
            "Objective validation complete",
            data={"rules": rules.model_dump()},
        )
        
        return {"objective_rules": rules}
    except Exception as e:
        logger.error(f"[VALIDATE_OBJECTIVE] Error: {str(e)}", exc_info=True)
        _emit_progress(
            progress_callback,
            ProgressEventType.STEP_ERROR,
            "objective_rules",
            "Validate Objectives",
            step_number,
            total_steps,
            error=str(e),
        )
        raise


def validate_krs(state: GraphState):
    progress_callback = state.get("progress_callback")
    step_number = 3
    total_steps = 5
    
    logger.info(f"[VALIDATE_KRS] Validating {len(state['okr'].key_results)} key results")
    _emit_progress(
        progress_callback,
        ProgressEventType.STEP_START,
        "kr_rules",
        "Validate Key Results",
        step_number,
        total_steps,
        f"Evaluating {len(state['okr'].key_results)} key results",
    )
    
    try:
        print(f"\n>>> [NODE: VALIDATE_KRS] Input (KRs): {state['okr'].key_results}")
        prompt = ChatPromptTemplate.from_template(KR_RULES_PROMPT)
        chain = prompt | get_llm_mini().with_structured_output(KRRules)
        results = []
        for i, kr in enumerate(state["okr"].key_results):
            print(f"    - Processing KR {i+1}: {kr}")
            logger.info(f"[VALIDATE_KRS] Processing KR {i+1}/{len(state['okr'].key_results)}")
            r = chain.invoke({"kr": kr})
            results.append(r)
        print("<<< [NODE: VALIDATE_KRS] Output:")
        pprint([r.model_dump() for r in results])
        
        logger.info(f"[VALIDATE_KRS] Key results validation complete")
        _emit_progress(
            progress_callback,
            ProgressEventType.STEP_COMPLETE,
            "kr_rules",
            "Validate Key Results",
            step_number,
            total_steps,
            f"Validated {len(results)} key results",
            data={"kr_rules": [r.model_dump() for r in results]},
        )
        
        return {"kr_rules": results}
    except Exception as e:
        logger.error(f"[VALIDATE_KRS] Error: {str(e)}", exc_info=True)
        _emit_progress(
            progress_callback,
            ProgressEventType.STEP_ERROR,
            "kr_rules",
            "Validate Key Results",
            step_number,
            total_steps,
            error=str(e),
        )
        raise


def objective_kr_alignment(state: GraphState):
    progress_callback = state.get("progress_callback")
    step_number = 4
    total_steps = 5
    
    logger.info(f"[OKR_ALIGNMENT] Checking alignment between objective and key results")
    _emit_progress(
        progress_callback,
        ProgressEventType.STEP_START,
        "okr_alignment",
        "OKR Alignment",
        step_number,
        total_steps,
        "Checking alignment between objective and key results",
    )
    
    try:
        data = {"objective": state["okr"].objective, "krs": state["okr"].key_results}
        print("\n>>> [NODE: O-KR ALIGNMENT] Input:")
        pprint(data)
        prompt = ChatPromptTemplate.from_template(OKR_ALIGNMENT_PROMPT)
        chain = prompt | get_llm_mini().with_structured_output(AlignmentResult)
        result = chain.invoke(
            {"objective": state["okr"].objective, "key_results": ", ".join(state["okr"].key_results)}
        )
        print("<<< [NODE: O-KR ALIGNMENT] Output:")
        pprint(result.model_dump())
        
        logger.info(f"[OKR_ALIGNMENT] Alignment check complete: {result.strength}")
        _emit_progress(
            progress_callback,
            ProgressEventType.STEP_COMPLETE,
            "okr_alignment",
            "OKR Alignment",
            step_number,
            total_steps,
            f"Alignment strength: {result.strength}",
            data={"alignment": result.model_dump()},
        )
        
        return {"okr_alignment": result}
    except Exception as e:
        logger.error(f"[OKR_ALIGNMENT] Error: {str(e)}", exc_info=True)
        _emit_progress(
            progress_callback,
            ProgressEventType.STEP_ERROR,
            "okr_alignment",
            "OKR Alignment",
            step_number,
            total_steps,
            error=str(e),
        )
        raise


def strategy_alignment(state: GraphState):
    progress_callback = state.get("progress_callback")
    step_number = 5
    total_steps = 5
    
    logger.info(f"[STRATEGY_ALIGNMENT] Checking strategic alignment")
    _emit_progress(
        progress_callback,
        ProgressEventType.STEP_START,
        "strategy_alignment",
        "Strategic Alignment",
        step_number,
        total_steps,
        "Evaluating alignment with strategic pillars",
    )
    
    try:
        data = {"strategy": DEFAULT_STRATEGY_DIRECTIVE, "objective": state["okr"].objective}
        print("\n>>> [NODE: OKR-STRATEGY ALIGNMENT] Input:")
        pprint(data)
        prompt = ChatPromptTemplate.from_template(STRATEGY_ALIGNMENT_PROMPT)

        def get_alignment(llm):
            chain = prompt | llm.with_structured_output(StrategicContext)
            return chain.invoke({"strategy_text": DEFAULT_STRATEGY_DIRECTIVE, "objective": state["okr"].objective})

        result = get_alignment(get_llm_mini())
        print(f"    - Initial LLM result: {result.model_dump()}")
        logger.info(f"[STRATEGY_ALIGNMENT] Initial alignment: {result.strength}")
        
        if result.strength == "Weak":
            print("    - Falling back to Strong LLM...")
            logger.info("[STRATEGY_ALIGNMENT] Weak alignment detected, using stronger LLM")
            _emit_progress(
                progress_callback,
                ProgressEventType.PROGRESS,
                "strategy_alignment",
                "Strategic Alignment",
                step_number,
                total_steps,
                "Using stronger model for detailed analysis",
            )
            result = get_alignment(get_llm_strong())
            print("    - Strong LLM result:")
            pprint(result.model_dump())
            logger.info(f"[STRATEGY_ALIGNMENT] Strong LLM alignment: {result.strength}")

        print("<<< [NODE: OKR-STRATEGY ALIGNMENT] Output:")
        pprint(result.model_dump())
        
        logger.info(f"[STRATEGY_ALIGNMENT] Strategic alignment complete: {result.pillar}")
        _emit_progress(
            progress_callback,
            ProgressEventType.STEP_COMPLETE,
            "strategy_alignment",
            "Strategic Alignment",
            step_number,
            total_steps,
            f"Aligned with {result.pillar} pillar",
            data={"strategy_alignment": result.model_dump()},
        )
        
        return {"strategy_alignment": result}
    except Exception as e:
        logger.error(f"[STRATEGY_ALIGNMENT] Error: {str(e)}", exc_info=True)
        _emit_progress(
            progress_callback,
            ProgressEventType.STEP_ERROR,
            "strategy_alignment",
            "Strategic Alignment",
            step_number,
            total_steps,
            error=str(e),
        )
        raise


def correct_okr(state: GraphState):
    progress_callback = state.get("progress_callback")
    step_number = 1
    total_steps = 1
    
    logger.info(f"[CORRECT_OKR] Starting OKR correction")
    _emit_progress(
        progress_callback,
        ProgressEventType.STEP_START,
        "correct",
        "Correct OKR",
        step_number,
        total_steps,
        "Analyzing validation issues and generating improvements",
    )
    
    try:
        # Extract validation issues from the report
        validation_issues = []
        if state.get("report"):
            report = state["report"]
            
            # Add objective issues
            if report.objective_analysis.suggestions:
                obj_issues = [f"{dimension}: {suggestion}" for dimension, suggestion in report.objective_analysis.suggestions.items()]
                validation_issues.extend([f"Objective - {issue}" for issue in obj_issues])
            
            # Add key result issues
            for i, kr_analysis in enumerate(report.key_results_analysis):
                if kr_analysis.suggestions:
                    kr_issues = [f"{dimension}: {suggestion}" for dimension, suggestion in kr_analysis.suggestions.items()]
                    validation_issues.extend([f"KR{i+1} - {issue}" for issue in kr_issues])
        
        logger.info(f"[CORRECT_OKR] Found {len(validation_issues)} validation issues")
        
        prompt = ChatPromptTemplate.from_template(CORRECTION_PROMPT)
        chain = prompt | get_llm_strong().with_structured_output(CorrectionOutput)
        
        _emit_progress(
            progress_callback,
            ProgressEventType.PROGRESS,
            "correct",
            "Correct OKR",
            step_number,
            total_steps,
            "Generating improved OKR using AI",
        )
        
        correction_output = chain.invoke(
            {
                "level": state["okr"].level,
                "objective": state["okr"].objective,
                "krs": "\n".join(state["okr"].key_results),
                "strategy_text": DEFAULT_STRATEGY_DIRECTIVE,
                "validation_issues": "\n".join(validation_issues) if validation_issues else "No specific validation issues",
            }
        )

        # Create corrected OKR
        corrected_okr = OKR(
            level=state["okr"].level,
            objective=correction_output.objective,
            key_results=correction_output.key_results
        )

        # Convert EntityImprovement list to dictionary format
        improvements_dict = {
            imp.entity: imp.improvements 
            for imp in correction_output.improvements
        }

        print("<<< [NODE: CORRECTOR] Output:")
        print(f"  Original: {state['okr'].objective}")
        print(f"  Corrected: {corrected_okr.objective}")
        print(f"  Summary: {correction_output.summary}")
        print(f"  Validation Issues: {len(validation_issues)} issues found")
        print(f"  Improvements: {improvements_dict}")
        
        logger.info(f"[CORRECT_OKR] Correction complete: {len(improvements_dict)} entities improved")
        _emit_progress(
            progress_callback,
            ProgressEventType.STEP_COMPLETE,
            "correct",
            "Correct OKR",
            step_number,
            total_steps,
            f"OKR corrected with {len(improvements_dict)} improvements",
            data={
                "corrected_okr": corrected_okr.model_dump(),
                "summary": correction_output.summary,
                "improvements": improvements_dict,
            },
        )
        
        return {
            "okr": corrected_okr,
            "correction_summary": correction_output.summary,
            "improvement": improvements_dict
        }
    except Exception as e:
        logger.error(f"[CORRECT_OKR] Error: {str(e)}", exc_info=True)
        _emit_progress(
            progress_callback,
            ProgressEventType.STEP_ERROR,
            "correct",
            "Correct OKR",
            step_number,
            total_steps,
            error=str(e),
        )
        raise