"""Prompt templates for monthly planner."""

MONTHLY_PLANNER_PROMPT = """You are an AI assistant helping a team leader create a monthly heads-up plan.

## Context
Team: {team_name}
Month: {month}
Team ID: {team_id}

## Current OKRs (Objectives and Key Results)
{okrs_context}

## Current BAU Activities
{bau_context}

## Previous Month's Work Items
{previous_work_items}

## Current Progress
OKR Progress: {okr_progress}
BAU Health: {bau_health}

## Task
Based on the team's OKRs, BAU activities, and current progress, create a comprehensive monthly heads-up plan that:
1. Identifies the key focus areas for the month
2. Suggests 5-10 strategic work items that align with OKRs or BAU activities
3. Provides a clear description of the month's priorities
4. Considers strategic alignment and potential risks

## Guidelines
- Work items should be actionable and specific
- Prioritize work items that will drive OKR progress or improve BAU health
- Consider dependencies and sequencing
- Balance between OKR-focused and BAU-focused work
- Each work item must be linked to either an OKR Key Result (source_type: "OKR", source_id: <kr_id>) or a BAU Activity (source_type: "BAU", source_id: <bau_activity_id>)
- Provide clear rationale for each work item

Generate a comprehensive monthly plan that will help the team focus on what matters most this month.
"""

