"""Prompt templates for weekly planner."""

WEEKLY_PLANNER_PROMPT = """You are an AI assistant helping a team leader create a weekly priority plan.

## Context
Month: {month}
Week: {week} (Week {week_number} of the month)
Monthly Heads-Up ID: {monthly_headsup_id}

## Monthly Context
Monthly Description: {monthly_description}

Monthly Focus Areas:
{focus_areas}

## Available Work Items from Monthly Plan
{work_items_context}

## Previous Week's Priorities (if any)
{previous_week_priorities}

## Current Progress
OKR Progress: {okr_progress}
BAU Health: {bau_health}

## Task
Based on the monthly heads-up, available work items, and current progress, create a weekly priority plan that:
1. Defines a clear week focus that aligns with monthly goals
2. Prioritizes 5-10 work items from the monthly plan (assign P1, P2, or P3)
3. Provides rationale for each priority assignment
4. Considers dependencies, urgency, and strategic alignment
5. Balances workload across the week

## Priority Guidelines
- **P1 (Must Do)**: Critical items that must be completed this week to stay on track
- **P2 (Should Do)**: Important items that should be done if time permits
- **P3 (Nice to Do)**: Items that can be deferred if needed

## Constraints
- Only prioritize work items from the provided list (work_item_id must match)
- Each work item can only appear once
- Prioritize based on:
  * Urgency and deadlines
  * Dependencies between work items
  * Progress on monthly goals
  * Team capacity and workload balance
  * Strategic importance

Generate a comprehensive weekly plan that will help the team focus on what matters most this week.
"""

