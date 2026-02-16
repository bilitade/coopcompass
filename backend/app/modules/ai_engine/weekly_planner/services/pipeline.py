"""LangGraph node implementations for weekly planning workflow."""
from pprint import pprint
from typing import Optional

from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.core.logging_config import logger
from app.modules.ai_engine.weekly_planner.schemas.state import (
    GraphState,
    WeeklyPlanOutput,
    WeeklyContext,
)

load_dotenv()

from app.modules.ai_engine.weekly_planner.prompts.templates import WEEKLY_PLANNER_PROMPT


def get_llm():
    """Get GPT-4o model instance for weekly planning."""
    return ChatOpenAI(model="gpt-4o", temperature=0.3)


def format_work_items_context(work_items: list) -> str:
    """Format work items for prompt context."""
    if not work_items:
        return "No work items available from monthly plan."
    
    formatted = []
    for item in work_items:
        item_str = f"Work Item ID: {item.id}\n"
        item_str += f"Title: {item.title}\n"
        if item.description:
            item_str += f"Description: {item.description}\n"
        item_str += f"Source: {item.source_type} - {item.source_name}\n"
        item_str += f"Status: {item.status}\n"
        item_str += f"Progress: {item.progress:.1f}%\n"
        if item.owner_name:
            item_str += f"Owner: {item.owner_name}\n"
        formatted.append(item_str)
    
    return "\n---\n".join(formatted)


def format_previous_week_priorities(priorities: list) -> str:
    """Format previous week's priorities for context."""
    if not priorities:
        return "No previous week priorities found."
    
    formatted = []
    for priority in priorities:
        priority_str = f"- {priority.get('work_item_title', 'N/A')} (P{priority.get('priority', '?')})"
        if priority.get('status'):
            priority_str += f" - Status: {priority.get('status', 'N/A')}"
        formatted.append(priority_str)
    
    return "\n".join(formatted)


def format_progress_summary(okr_progress: dict, bau_health: dict) -> str:
    """Format progress summary."""
    okr_str = ", ".join([f"{k}: {v:.1f}%" for k, v in okr_progress.items()]) if okr_progress else "N/A"
    bau_str = ", ".join([f"{k}: {v:.1f}%" for k, v in bau_health.items()]) if bau_health else "N/A"
    return f"OKR Progress: {okr_str}\nBAU Health: {bau_str}"


def generate_weekly_plan(state: GraphState):
    """Generate weekly plan using AI."""
    logger.info("[WEEKLY_PLANNER] Starting weekly plan generation")
    
    weekly_context = state.get("weekly_context")
    if not weekly_context:
        raise ValueError("Weekly context is required")
    
    try:
        # Format context for prompt
        work_items_context = format_work_items_context(weekly_context.work_items)
        previous_week_priorities = format_previous_week_priorities(weekly_context.previous_week_priorities)
        progress_summary = format_progress_summary(
            weekly_context.current_okr_progress,
            weekly_context.current_bau_health
        )
        
        # Format focus areas
        focus_areas_str = "\n".join([f"- {area}" for area in weekly_context.monthly_focus_areas]) if weekly_context.monthly_focus_areas else "None specified"
        
        # Build prompt
        prompt = ChatPromptTemplate.from_template(WEEKLY_PLANNER_PROMPT)
        chain = prompt | get_llm().with_structured_output(WeeklyPlanOutput)
        
        logger.info(f"[WEEKLY_PLANNER] Generating plan for month {weekly_context.month}, week {weekly_context.week}")
        
        # Invoke LLM
        weekly_plan = chain.invoke({
            "month": weekly_context.month,
            "week": weekly_context.week,
            "week_number": weekly_context.week_number,
            "monthly_headsup_id": weekly_context.monthly_headsup_id,
            "monthly_description": weekly_context.monthly_description,
            "focus_areas": focus_areas_str,
            "work_items_context": work_items_context,
            "previous_week_priorities": previous_week_priorities,
            "okr_progress": progress_summary.split("\n")[0],
            "bau_health": progress_summary.split("\n")[1] if "\n" in progress_summary else "N/A",
        })
        
        logger.info(f"[WEEKLY_PLANNER] Generated plan with {len(weekly_plan.prioritized_work_items)} prioritized work items")
        pprint(weekly_plan.model_dump())
        
        return {"weekly_plan": weekly_plan}
        
    except Exception as e:
        logger.error(f"[WEEKLY_PLANNER] Error generating plan: {str(e)}", exc_info=True)
        raise

