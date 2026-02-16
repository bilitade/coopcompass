"""Prompt templates for OKR validation and correction."""

SHIFT_AT_SCALE_COMPACT = """S.C.A.L.E Pillars:
S: Sustainable Strength (1T assets, CAR>=11.5%, ESG)
C: Customer & Community (30M customers, rural, MSME/Agri growth)
A: Agility & Accuracy (80% automation, 90% digital, cloud)
L: Leadership & Learning (70% internal promotion, 30% women leaders)
E: Expansion & Ecosystem (Coop Holdings, M&A, regional expansion)"""

DEFAULT_STRATEGY_DIRECTIVE = (
    "To be the most customer-centric company in the world by providing exceptional service and support."
)

EXTRACT_OKR_PROMPT = """
Extract and classify the OKR from the source text. Quote exactly as written.

OKR LEVELS:
- STRATEGIC: organisation-wide, long-term transformation
- TACTICAL: quarterly/team execution goals
- OPERATIONAL: daily performance or efficiency targets

Source: {input}

Return: level, objective, key_results (list of strings)
"""

OBJECTIVE_RULES_PROMPT = """
Evaluate the objective using S.C.A.L.E.I.T criteria against Shift@Scale pillars.

Objective: {objective}
Pillars: {pillars}

Score each (1.0, 0.75, 0.5, 0.25, or 0.0):
- strategic (8pts): drives org-wide transformation
- concrete (6pts): measurable end-impact
- action_oriented (5pts): decisive transformation verb
- linked_to_purpose (5pts): advances "Empowering Communities, Transforming Lives"
- emotionally_engaging (5pts): inspiring tone
- impactful (6pts): step-change outcome
- time_bound (5pts): achievable in cycle (1.0, 0.5, or 0.0 only)

Return with exact dimension names:
- positive_feedback: [{{"dimension": "<name>", "comment": "reason"}}] for 1.0 scores
- suggestions: [{{"dimension": "<name>", "comment": "fix"}}] for <1.0 scores

Use only: strategic, concrete, action_oriented, linked_to_purpose, emotionally_engaging, impactful, time_bound
"""

KR_RULES_PROMPT = """
Evaluate the key result using C.L.E.A.R criteria.

Key Result: {kr}

Score each (1.0, 0.75, 0.5, 0.25, or 0.0):
- concrete (7pts): metric + target + timeframe
- leading_lagging (5pts): driver or outcome
- evaluated (5pts): deterministic measurement
- ambitious (5pts): stretch beyond BAU
- real_time_trackable (5pts): refreshes more than quarterly (1.0, 0.5, or 0.0 only)

Return with exact dimension names:
- positive_feedback: [{{"dimension": "<name>", "comment": "reason"}}] for 1.0 scores
- suggestions: [{{"dimension": "<name>", "comment": "fix"}}] for <1.0 scores

Use only: concrete, leading_lagging, evaluated, ambitious, real_time_trackable
"""

CORRECTION_PROMPT = """
Improve this OKR to meet strategic and measurement standards. Preserve level: {level}.

Original OKR:
Objective: {objective}
Key Results: {krs}

Validation Issues to Fix:
{validation_issues}

Strategy: {strategy_text}

OBJECTIVE STANDARDS (S.C.A.L.E.I.T):
- strategic: drives org-wide transformation
- concrete: measurable end-impact
- action_oriented: decisive transformation verb
- linked_to_purpose: advances "Empowering Communities, Transforming Lives"
- emotionally_engaging: inspiring tone
- impactful: step-change outcome
- time_bound: achievable in cycle

KEY RESULT STANDARDS (C.L.E.A.R):
- concrete: metric + target + timeframe
- leading_lagging: outcome-focused (not activities)
- evaluated: objectively scorable
- ambitious: stretch beyond BAU
- real_time_trackable: refreshes more than quarterly

Focus on fixing the specific validation issues listed above while meeting all standards.
Provide improvements organized by entity (objective, kr1, kr2, kr3) with specific changes made to each.
"""


OKR_ALIGNMENT_PROMPT = """
Assess if the key results measure the objective's success.

Objective: {objective}
Key Results: {key_results}

Score:
- Strong (1.0): each KR evidences objective
- Partial (0.5): some linkage, gaps remain
- Weak (0.0): KRs don't measure objective

Return with exact dimension name:
- positive_feedback: [{{"dimension": "alignment", "comment": "reason"}}] if Strong
- suggestions: [{{"dimension": "alignment", "comment": "fix"}}] if not Strong

Use only: alignment
"""

STRATEGY_ALIGNMENT_PROMPT = """
Assess how the objective advances the strategy.

Strategy: {strategy_text}
Objective: {objective}

Score:
- Strong (1.0): clearly delivers strategy
- Partial (0.5): tangential link
- Weak (0.0): no connection

Return pillar (S/C/A/L/E letter only), strength, score with exact dimension name:
- positive_feedback: [{{"dimension": "strategic", "comment": "reason"}}] if Strong
- suggestions: [{{"dimension": "strategic", "comment": "fix"}}] if not Strong

Use only: strategic
"""