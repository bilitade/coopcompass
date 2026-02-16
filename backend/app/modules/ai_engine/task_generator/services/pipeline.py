"""LangGraph node implementations for task generation workflow."""
from pprint import pprint
from typing import Optional

from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.core.logging_config import logger
from app.modules.ai_engine.task_generator.schemas.state import (
    GraphState,
    TaskGenerationOutput,
    TaskGenerationContext,
)

load_dotenv()

from app.modules.ai_engine.task_generator.prompts.templates import TASK_GENERATOR_PROMPT


def get_llm():
    """Get GPT-4o model instance for task generation."""
    return ChatOpenAI(model="gpt-4o", temperature=0.3)


def format_work_items_context(work_items: list) -> str:
    """Format work items for prompt context."""
    if not work_items:
        return "No prioritized work items available."
    
    formatted = []
    for item in work_items:
        item_str = f"Work Item ID: {item.work_item_id}\n"
        item_str += f"Title: {item.title}\n"
        if item.description:
            item_str += f"Description: {item.description}\n"
        item_str += f"Priority: P{item.priority} ({'Must Do' if item.priority == 1 else 'Should Do' if item.priority == 2 else 'Nice to Do'})\n"
        item_str += f"Source: {item.source_type} - {item.source_name}\n"
        item_str += f"Status: {item.status}\n"
        item_str += f"Progress: {item.progress:.1f}%\n"
        if item.existing_tasks:
            item_str += f"Existing Tasks: {len(item.existing_tasks)}\n"
        formatted.append(item_str)
    
    return "\n---\n".join(formatted)


def format_team_members_context(team_members: list) -> str:
    """Format team members for prompt context."""
    if not team_members:
        return "No team members available."
    
    formatted = []
    for member in team_members:
        member_str = f"Member ID: {member.id}\n"
        member_str += f"Name: {member.name}\n"
        member_str += f"Role: {member.role}\n"
        member_str += f"Current Workload: {member.current_workload} active tasks\n"
        formatted.append(member_str)
    
    return "\n---\n".join(formatted)


def format_existing_tasks_context(work_items: list) -> str:
    """Format existing tasks for context."""
    all_tasks = []
    for item in work_items:
        if item.existing_tasks:
            for task in item.existing_tasks:
                all_tasks.append(f"Work Item {item.work_item_id}: {task.get('title', 'N/A')} ({task.get('status', 'N/A')})")
    
    if not all_tasks:
        return "No existing tasks found."
    
    return "\n".join(all_tasks)


def generate_tasks(state: GraphState):
    """Generate tasks using AI."""
    logger.info("[TASK_GENERATOR] Starting task generation")
    
    task_context = state.get("task_context")
    if not task_context:
        raise ValueError("Task context is required")
    
    try:
        # Format context for prompt
        work_items_context = format_work_items_context(task_context.work_items)
        team_members_context = format_team_members_context(task_context.team_members)
        existing_tasks_context = format_existing_tasks_context(task_context.work_items)
        
        # Determine focus priority text
        if task_context.focus_priority:
            focus_priority_text = f"P{task_context.focus_priority} (priority {task_context.focus_priority})"
        else:
            focus_priority_text = "all priority levels (P1, P2, P3)"
        
        # Build prompt
        prompt = ChatPromptTemplate.from_template(TASK_GENERATOR_PROMPT)
        chain = prompt | get_llm().with_structured_output(TaskGenerationOutput)
        
        logger.info(f"[TASK_GENERATOR] Generating tasks for week {task_context.week}, {len(task_context.work_items)} work items")
        
        # Invoke LLM
        task_output = chain.invoke({
            "week": task_context.week,
            "week_focus": task_context.week_focus,
            "work_items_context": work_items_context,
            "team_members_context": team_members_context,
            "existing_tasks_context": existing_tasks_context,
            "focus_priority_text": focus_priority_text,
        })
        
        logger.info(f"[TASK_GENERATOR] Generated {len(task_output.tasks)} tasks")
        pprint(task_output.model_dump())
        
        return {"task_output": task_output}
        
    except Exception as e:
        logger.error(f"[TASK_GENERATOR] Error generating tasks: {str(e)}", exc_info=True)
        raise

