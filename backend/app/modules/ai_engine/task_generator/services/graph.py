"""Graph builder utilities for task generator."""
from langgraph.graph import END, StateGraph

from app.modules.ai_engine.task_generator.schemas.state import GraphState
from app.modules.ai_engine.task_generator.services.pipeline import generate_tasks


def build_task_generator_graph() -> StateGraph:
    """Build the task generator LangGraph."""
    builder = StateGraph(GraphState)
    
    # Add nodes
    builder.add_node("generate_tasks", generate_tasks)
    
    # Set entry point
    builder.set_entry_point("generate_tasks")
    
    # Add edge to end
    builder.add_edge("generate_tasks", END)
    
    return builder.compile()

