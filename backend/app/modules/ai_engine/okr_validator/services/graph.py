"""Graph builder utilities for OKR validation and correction."""
from langgraph.graph import END, StateGraph

from app.modules.ai_engine.okr_validator.schemas.okr import GraphState
from app.modules.ai_engine.okr_validator.services.pipeline import (
    correct_okr,
    extract_okr,
    objective_kr_alignment,
    strategy_alignment,
    validate_krs,
    validate_objective,
)


def build_validator_graph() -> StateGraph:
    builder = StateGraph(GraphState)
    builder.add_node("extract", extract_okr)
    builder.add_node("objective_rules", validate_objective)
    builder.add_node("kr_rules", validate_krs)
    builder.add_node("okr_alignment", objective_kr_alignment)
    builder.add_node("strategy_alignment", strategy_alignment)

    builder.set_entry_point("extract")
    builder.add_edge("extract", "objective_rules")
    builder.add_edge("objective_rules", "kr_rules")
    builder.add_edge("kr_rules", "okr_alignment")
    builder.add_edge("okr_alignment", "strategy_alignment")
    builder.add_edge("strategy_alignment", END)

    return builder.compile()


def build_corrector_graph() -> StateGraph:
    builder = StateGraph(GraphState)
    builder.add_node("correct", correct_okr)
    builder.set_entry_point("correct")
    builder.add_edge("correct", END)

    return builder.compile()
