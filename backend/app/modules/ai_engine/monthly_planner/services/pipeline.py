"""LangGraph node implementations for monthly planning workflow."""
from pprint import pprint
from typing import Callable, Optional

from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.core.logging_config import logger
from app.modules.ai_engine.monthly_planner.schemas.state import (
    GraphState,
    MonthlyPlanOutput,
    TeamContext,
)

load_dotenv()

from app.modules.ai_engine.monthly_planner.prompts.templates import MONTHLY_PLANNER_PROMPT


def get_llm():
    """Get GPT-4o model instance for monthly planning."""
    return ChatOpenAI(model="gpt-4o", temperature=0.3)


def format_okrs_context(okrs: list) -> str:
    """Format OKRs for prompt context."""
    if not okrs:
        return "No active OKRs found."
    
    formatted = []
    for okr in okrs:
        okr_str = f"OKR ID: {okr.get('id')}\n"
        okr_str += f"Objective: {okr.get('objective', 'N/A')}\n"
        okr_str += f"Quarter: {okr.get('quarter', 'N/A')}\n"
        okr_str += f"Status: {okr.get('status', 'N/A')}\n"
        okr_str += f"Progress: {okr.get('progress', 0):.1f}%\n"
        
        key_results = okr.get('key_results', [])
        if key_results:
            okr_str += "Key Results:\n"
            for kr in key_results:
                kr_progress = kr.get('progress', 0)
                okr_str += f"  - KR ID: {kr.get('id')} | {kr.get('description', 'N/A')} | "
                okr_str += f"Progress: {kr_progress:.1f}% | "
                okr_str += f"Current: {kr.get('current_value', 0)} / Target: {kr.get('target_value', 0)} {kr.get('unit', '')}\n"
        
        formatted.append(okr_str)
    
    return "\n---\n".join(formatted)


def format_bau_context(bau_activities: list) -> str:
    """Format BAU activities for prompt context."""
    if not bau_activities:
        return "No active BAU activities found."
    
    formatted = []
    for activity in bau_activities:
        activity_str = f"BAU Activity ID: {activity.get('id')}\n"
        activity_str += f"Name: {activity.get('name', 'N/A')}\n"
        activity_str += f"Description: {activity.get('description', 'N/A')}\n"
        activity_str += f"Health Score: {activity.get('health_score', 0):.1f}%\n"
        
        metrics = activity.get('metrics', [])
        if metrics:
            activity_str += "Metrics:\n"
            for metric in metrics:
                metric_score = metric.get('score', 0)
                activity_str += f"  - {metric.get('name', 'N/A')}: {metric_score:.1f}% | "
                activity_str += f"Current: {metric.get('current_value', 0)} / Target: {metric.get('target_value', 0)} {metric.get('unit', '')}\n"
        
        formatted.append(activity_str)
    
    return "\n---\n".join(formatted)


def format_previous_work_items(work_items: list) -> str:
    """Format previous month's work items for context."""
    if not work_items:
        return "No previous work items found."
    
    formatted = []
    for item in work_items:
        item_str = f"- {item.get('title', 'N/A')} ({item.get('status', 'N/A')})"
        if item.get('description'):
            item_str += f": {item.get('description', '')[:100]}"
        formatted.append(item_str)
    
    return "\n".join(formatted)


def format_progress_summary(okr_progress: dict, bau_health: dict) -> str:
    """Format progress summary."""
    okr_str = ", ".join([f"{k}: {v:.1f}%" for k, v in okr_progress.items()]) if okr_progress else "N/A"
    bau_str = ", ".join([f"{k}: {v:.1f}%" for k, v in bau_health.items()]) if bau_health else "N/A"
    return f"OKR Progress: {okr_str}\nBAU Health: {bau_str}"


def generate_monthly_plan(state: GraphState):
    """Generate monthly plan using AI."""
    logger.info("[MONTHLY_PLANNER] Starting monthly plan generation")
    
    team_context = state.get("team_context")
    if not team_context:
        raise ValueError("Team context is required")
    
    try:
        # Format context for prompt
        okrs_context = format_okrs_context(team_context.okrs)
        bau_context = format_bau_context(team_context.bau_activities)
        previous_work_items = format_previous_work_items(team_context.previous_month_work_items)
        progress_summary = format_progress_summary(
            team_context.current_okr_progress,
            team_context.current_bau_health
        )
        
        # Build prompt
        prompt = ChatPromptTemplate.from_template(MONTHLY_PLANNER_PROMPT)
        chain = prompt | get_llm().with_structured_output(MonthlyPlanOutput)
        
        logger.info(f"[MONTHLY_PLANNER] Generating plan for team {team_context.team_id}, month {team_context.month}")
        
        # Invoke LLM
        monthly_plan = chain.invoke({
            "team_name": team_context.team_name,
            "team_id": team_context.team_id,
            "month": team_context.month,
            "okrs_context": okrs_context,
            "bau_context": bau_context,
            "previous_work_items": previous_work_items,
            "okr_progress": progress_summary.split("\n")[0],
            "bau_health": progress_summary.split("\n")[1] if "\n" in progress_summary else "N/A",
        })
        
        logger.info(f"[MONTHLY_PLANNER] Generated plan with {len(monthly_plan.work_items)} work items")
        pprint(monthly_plan.model_dump())
        
        return {"monthly_plan": monthly_plan}
        
    except Exception as e:
        logger.error(f"[MONTHLY_PLANNER] Error generating plan: {str(e)}", exc_info=True)
        raise

