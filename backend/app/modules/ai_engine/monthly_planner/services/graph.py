"""Graph builder utilities for monthly planner."""
from langgraph.graph import END, StateGraph

from app.modules.ai_engine.monthly_planner.schemas.state import GraphState
from app.modules.ai_engine.monthly_planner.services.pipeline import generate_monthly_plan


def build_monthly_planner_graph() -> StateGraph:
    """Build the monthly planner LangGraph."""
    builder = StateGraph(GraphState)
    
    # Add nodes
    builder.add_node("generate_plan", generate_monthly_plan)
    
    # Set entry point
    builder.set_entry_point("generate_plan")
    
    # Add edge to end
    builder.add_edge("generate_plan", END)
    
    return builder.compile()

