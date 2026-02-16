"""Graph builder utilities for weekly planner."""
from langgraph.graph import END, StateGraph

from app.modules.ai_engine.weekly_planner.schemas.state import GraphState
from app.modules.ai_engine.weekly_planner.services.pipeline import generate_weekly_plan


def build_weekly_planner_graph() -> StateGraph:
    """Build the weekly planner LangGraph."""
    builder = StateGraph(GraphState)
    
    # Add nodes
    builder.add_node("generate_plan", generate_weekly_plan)
    
    # Set entry point
    builder.set_entry_point("generate_plan")
    
    # Add edge to end
    builder.add_edge("generate_plan", END)
    
    return builder.compile()

