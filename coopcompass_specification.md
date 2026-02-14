# Compass
## Team Performance Tracking System

**Company:** Cooperative Bank of Oromia  
**Version:** 1.0 Final  
**Date:** February 2026

---

## 1. Problem Statement

Cooperative Bank of Oromia is one of the largest private banks in Ethiopia with multiple departments, teams, and retail branches. Currently:

**Problems:**
- No automated platform to track OKR (strategic goals) and BAU (operational work)
- Manual, time-consuming reporting
- BAU work incorrectly reported as OKRs
- No visibility into team progress
- Executives cannot get timely information for decisions
- False reports, not factual

**Solution Needed:**
Automated system to track OKRs, BAU, and tasks with seamless visibility for all stakeholders.

---

## 2. System Overview

### 2.1 What Compass Tracks

**OKR (Strategic Goals)**
- Quarterly objectives with weighted Key Results
- Measured by actual metric values (customers, revenue, etc.)
- Score: 0.0 to 1.0

**BAU (Operational Work)**
- Ongoing activities with KPI metrics
- Measured against target values
- Score: 0-100%

**Tasks**
- Individual work assignments
- Execution tracking

### 2.2 Workflow

```
Quarterly: Setup OKRs + BAU
    ↓
Monthly: Create Monthly Heads-Up → Work Items
    ↓
Weekly: Create Weekly Priority Plan → Prioritize → Tasks
    ↓
Daily: Execute Tasks
    ↓
Friday: Measure & Report
```

---

## 3. User Roles

| Role | Access |
|------|--------|
| **Admin** | Full system access |
| **Manager/Team Lead** | Own team: Create, Read, Update, Delete |
| **Team Member** | Own tasks: Read, Update |
| **Director** | Own department: Read only |
| **Executive** | All teams: Read only |

---

## 4. Core Entities

### 4.1 OKR

**Objective**
- Quarter (Q1 2026, Q2 2026, etc.)
- Objective statement
- Contains: 2-5 Key Results

**Key Result**
- Description
- Base (starting value)
- Target (goal value)
- Current (actual progress, updated weekly)
- Unit (customers, Birr, %, etc.)
- Weight (0.0-1.0, must sum to 1.0 per objective)

**Score Formula:**
```
KR Score = (current - base) / (target - base)
Range: 0.0 to 1.0

Objective Score = SUM(KR Score × KR Weight)
```

**Example:**
```
Team: Retail Banking - Addis Branch
Quarter: Q1 2026

Objective: "Expand Customer Base"

KR1: "Increase customers from 500,000 to 750,000"
  Base: 500,000
  Target: 750,000
  Current: 625,000
  Weight: 0.4
  Score: (625,000 - 500,000) / (750,000 - 500,000)
        = 125,000 / 250,000
        = 0.50 (50% progress, 125K out of 250K increase)

KR2: "Increase deposits from 800M to 1.2B Birr"
  Base: 800,000,000
  Target: 1,200,000,000
  Current: 1,050,000,000
  Weight: 0.6
  Score: (1,050M - 800M) / (1,200M - 800M)
        = 250M / 400M
        = 0.625 (62.5% progress, 250M out of 400M increase)

Objective Score: (0.50 × 0.4) + (0.625 × 0.6) = 0.575
```

### 4.2 BAU

**BAU Activity**
- Activity name (e.g., "Branch Operations")
- Contains: 1-5 KPI Metrics

**BAU Metric**
- Name
- Target value
- Current value (updated weekly)
- Unit
- Weight (0.0-1.0, must sum to 1.0 per activity)
- Type: Higher is Better OR Lower is Better

**Score Formula:**
```
IF Higher is Better:
  Achievement = (current / target) × 100, capped at 100

IF Lower is Better:
  Achievement = (target / current) × 100, capped at 100

Activity Score = SUM(Achievement × Weight)
Overall BAU Health = AVERAGE(All Activity Scores)
```

**Example:**
```
Team: Retail Banking - Addis Branch

BAU Activity: "Branch Operations"

Metric 1: Transaction Accuracy (Higher is Better)
  Target: 99.9%
  Current: 99.95%
  Weight: 0.5
  Achievement: (99.95 / 99.9) × 100 = 100% (capped)

Metric 2: Wait Time (Lower is Better)
  Target: 5 minutes
  Current: 4.2 minutes
  Weight: 0.5
  Achievement: (5 / 4.2) × 100 = 100% (capped)

Activity Score: (100 × 0.5) + (100 × 0.5) = 100%
```

### 4.3 Monthly Heads-Up

**Monthly Heads-Up**
- Month (2026-01, 2026-02, 2026-03)
- Description (month's focus)
- Created by Manager
- Contains: Work Items

**Purpose:** Container for the month's planned work with context.

**Example:**
```
Monthly Heads-Up: January 2026
Team: Retail Banking - Addis Branch
Description: "Focus on customer acquisition through referral programs  
             and operational efficiency improvements."

Work Items created:
1. Launch referral program (→ KR1)
2. Open Bole sub-branch (→ KR1)
3. Optimize teller workflow (→ BAU: Branch Operations)
4. Train new tellers (→ BAU: Branch Operations)
```

### 4.4 Work Item

**Work Item**
- Monthly Heads-Up reference
- Source Type: OKR or BAU
- Source ID: Which KR or BAU Activity
- Title
- Owner: Manager (always)
- Status: Not Started / In Progress / Completed

**Purpose:** Specific deliverable for the month.

### 4.5 Weekly Priority Plan

**Weekly Priority Plan**
- Monthly Heads-Up reference
- Week (2026-W01, 2026-W02, etc.)
- Week Focus (description)
- Created by Manager
- Contains: Weekly Priorities

**Purpose:** Container for the week's prioritized work.

**Example:**
```
Weekly Priority Plan: Week 1 (Jan 6-12, 2026)
Month: January 2026
Week Focus: "Launch referral program and complete system maintenance"

Priorities:
P1: Launch referral program (must complete)
P1: Train new tellers (must complete)
P2: Optimize workflow (if capacity allows)
```

### 4.6 Weekly Priority

**Weekly Priority**
- Weekly Priority Plan reference
- Work Item reference
- Priority: P1 / P2 / P3

**Rules:**
- P1: Critical (minimum 1, maximum 3 per week)
- P2: Important (optional)
- P3: Nice to have (optional)

### 4.7 Task

**Task**
- Work Item reference
- Assigned To: Team Member
- Description
- Status: Not Started / In Progress / Done / Blocked
- Estimated hours

**Purpose:** Individual work assignment.

---

## 5. Measurement Standards

### 5.1 OKR Status Bands

| Score | Status | Meaning |
|-------|--------|---------|
| 0.7 - 1.0 | 🟢 Green | On track or ahead |
| 0.4 - 0.6 | 🟡 Yellow | At risk |
| 0.0 - 0.3 | 🔴 Red | Off track |

### 5.2 BAU Status Bands

| Score | Status | Meaning |
|-------|--------|---------|
| 95-100% | 🟢 Excellent | Outstanding |
| 90-94% | 🟢 Good | Strong |
| 85-89% | 🟡 Acceptable | Minimum standard |
| 80-84% | 🟡 Warning | Needs improvement |
| <80% | 🔴 Poor | Immediate action |

---

## 6. Workflows

### 6.1 Quarterly Planning (Week 1 of Quarter)

**Manager creates:**
1. Objective statement
2. 2-5 Key Results with base, target, unit, weight
3. BAU Activities with 1-5 metrics

**Output:** Quarter initialized

### 6.2 Monthly Heads-Up (First Monday of Month)

**Manager creates:**
1. Monthly Heads-Up with description
2. Selects focus: Which KRs and BAU Activities
3. Creates 5-10 Work Items linked to KRs or BAU Activities

**Example:**
```
Step 1: Create January 2026 Heads-Up
Description: "Customer acquisition and efficiency focus"

Step 2: Select Focus
- KR1: Increase customers
- BAU: Branch Operations

Step 3: Create Work Items
1. "Launch referral program" → KR1
2. "Optimize teller workflow" → BAU
3. "Train new tellers" → BAU
```

**Output:** Monthly plan with work items

### 6.3 Weekly Planning (Every Monday)

**Manager creates:**
1. Weekly Priority Plan with week focus
2. Selects work items from Monthly Heads-Up
3. Assigns P1/P2/P3 priorities
4. Creates tasks for P1 (and optionally P2/P3) items
5. Assigns tasks to team members

**Example:**
```
Step 1: Create Week 1 Priority Plan
Week Focus: "Launch campaign week"

Step 2: Prioritize Work Items
P1: Launch referral program (must do)
P1: Train new tellers (must do)
P2: Optimize workflow (should do)

Step 3: Create Tasks for P1 Items

For "Launch referral program":
- Design materials → Hanna (6h)
- Train staff → Sara (4h)
- Launch campaign → Manager (2h)

For "Train new tellers":
- Prepare training materials → Sara (3h)
- Conduct training → Manager (4h)
```

**Output:** Week's priorities with assigned tasks

### 6.4 Daily Execution (Monday-Thursday)

**Team Members:**
1. View assigned tasks
2. Update task status: Not Started → In Progress → Done
3. Flag if blocked

### 6.5 Friday Measurement

**Manager updates:**
1. KR current values (from actual data)
2. BAU metric current values (from actual data)

**System calculates automatically:**
1. All KR scores
2. Objective score
3. OKR status (Green/Yellow/Red)
4. BAU metric achievements
5. BAU activity scores
6. Overall BAU health
7. Weekly snapshot
8. Reports

**Example:**
```
Friday Update:

KR1: Increase customers 500K → 750K
  Previous: 625,000
  New Current: 640,000 (from CRM)
  Score: (640K - 500K) / (750K - 500K) = 140K/250K = 0.56

KR2: Increase deposits 800M → 1.2B
  Previous: 1,050M
  New Current: 1,080M (from finance)
  Score: (1,080M - 800M) / (1,200M - 800M) = 280M/400M = 0.70

Objective: (0.56 × 0.4) + (0.70 × 0.6) = 0.644 🟡 Yellow

System auto-generates report and sends notifications.
```

---

## 7. User Interfaces

### 7.1 Manager Dashboard

```
┌────────────────────────────────────────────┐
│ RETAIL BANKING - ADDIS BRANCH             │
│ Q1 2026, Week 7 | Manager: Tigist         │
├────────────────────────────────────────────┤
│                                            │
│ OKR: Expand Customer Base - 0.64 🟡       │
│                                            │
│ KR1 (40%): Customers 500K → 750K          │
│   Current: 640,000 | Score: 0.56 🟡      │
│   Progress: 140K of 250K increase (56%)   │
│   [Update Value]                           │
│                                            │
│ KR2 (60%): Deposits 800M → 1.2B           │
│   Current: 1,080M | Score: 0.70 🟢       │
│   Progress: 280M of 400M increase (70%)   │
│   [Update Value]                           │
│                                            │
│ BAU: Branch Operations - 100% 🟢          │
│   Accuracy: 99.95% | Wait: 4.2min         │
│   [Update Metrics]                         │
│                                            │
│ THIS WEEK (Week 7)                         │
│ P1: Launch referral - 3/3 tasks ✓        │
│ P1: Train tellers - 2/2 tasks ✓          │
│                                            │
│ [Monthly Heads-Up] [Weekly Plan] [Reports] │
└────────────────────────────────────────────┘
```

### 7.2 Executive Dashboard

```
┌────────────────────────────────────────────┐
│ COOPERATIVE BANK OF OROMIA               │
│ Q1 2026, Week 7                           │
├────────────────────────────────────────────┤
│                                            │
│ BANK PERFORMANCE                           │
│ Teams: 18 | Avg OKR: 0.66 🟡 | BAU: 92% 🟢│
│                                            │
│ DEPARTMENTS                                │
│                                            │
│ IT & Digital (3 teams)                    │
│ OKR: 0.72 🟢 | BAU: 95% 🟢               │
│                                            │
│ Retail Banking (5 teams)                  │
│ OKR: 0.64 🟡 | BAU: 92% 🟢               │
│ └─ Addis Branch: 0.64 🟡 | 100% 🟢       │
│                                            │
│ Corporate Banking (4 teams)               │
│ OKR: 0.69 🟡 | BAU: 89% 🟢               │
│                                            │
│ Loan Operations (6 teams)                 │
│ OKR: 0.59 🟡 | BAU: 87% 🟢               │
│                                            │
│ [Details] [Export] [Trends]               │
└────────────────────────────────────────────┘
```

---

## 8. Data Model

### 8.1 Tables

| Table | Key Fields | Purpose |
|-------|------------|---------|
| **okrs** | team_id, quarter, objective | Strategic goals |
| **key_results** | okr_id, base, target, current, unit, weight | Metrics |
| **bau_activities** | team_id, name | Operational areas |
| **bau_metrics** | bau_activity_id, target, current, weight, type | KPIs |
| **monthly_headsup** | team_id, month, description | Monthly plan |
| **work_items** | monthly_headsup_id, source_type, source_id | Deliverables |
| **weekly_priority_plans** | monthly_headsup_id, week, week_focus | Weekly plan |
| **weekly_priorities** | weekly_priority_plan_id, work_item_id, priority | P1/P2/P3 |
| **tasks** | work_item_id, assignee_id, status | Individual work |

### 8.2 Relationships

```
OKR
  └─ Key Results

BAU Activity
  └─ BAU Metrics

Monthly Heads-Up
  └─ Work Items
      ├─ Links to: Key Result OR BAU Activity
      └─ Selected in: Weekly Priority Plans

Weekly Priority Plan
  └─ Weekly Priorities
      └─ References: Work Items

Work Item
  └─ Tasks
```

### 8.3 Critical Constraints

- KR weights must sum to 1.0 per objective
- BAU metric weights must sum to 1.0 per activity
- Minimum 1 P1, maximum 3 P1 per week
- Work item owner is always Manager
- Task assigned to one team member

---

## 9. Calculations

### 9.1 OKR

```python
def calculate_kr_score(base, target, current):
    if target == base:
        return 1.0 if current >= target else 0.0
    score = (current - base) / (target - base)
    return max(0.0, min(1.0, score))

def calculate_objective_score(key_results):
    return sum(kr.score * kr.weight for kr in key_results)
```

### 9.2 BAU

```python
def calculate_metric_achievement(metric):
    if metric.type == "Higher is Better":
        achievement = (metric.current / metric.target) * 100
    else:
        achievement = (metric.target / metric.current) * 100
    return min(achievement, 100)

def calculate_activity_score(metrics):
    return sum(m.achievement * m.weight for m in metrics)

def calculate_bau_health(activities):
    return sum(a.score for a in activities) / len(activities)
```

---

## 10. AI Engine (Future)

**Capabilities:**
- Suggest work items based on OKR/BAU gaps
- Recommend weekly priorities based on urgency
- Generate task breakdowns from work items
- Alert on at-risk OKRs/BAU metrics

**Note:** Core system works without AI. AI enhances efficiency.

---

## 11. Validation Criteria

### 11.1 Business Team

**Must Verify:**
- [ ] OKR score calculates correctly from values
- [ ] KR weights sum to 1.0
- [ ] BAU score calculates correctly from metrics
- [ ] BAU metric weights sum to 1.0
- [ ] Can create Monthly Heads-Up with description
- [ ] Can create Weekly Priority Plan with focus
- [ ] Can prioritize work items (P1/P2/P3)
- [ ] Can create and assign tasks
- [ ] Friday automation works
- [ ] Reports are accurate

### 11.2 Engineering Team

**Must Implement:**
- [ ] All formulas correctly
- [ ] Data constraints (weights sum to 1.0)
- [ ] Role-based access control
- [ ] Weekly snapshot job (Friday 5pm)
- [ ] Real-time score updates
- [ ] P1 validation (min 1, max 3)

---

## 12. Success Criteria

**System is ready when:**
- Pilot with 1 team successful (1 full quarter)
- All calculations verified
- Manager reports <30 min weekly planning
- Manager reports <15 min Friday updates
- Executives get timely, accurate data
- No critical bugs
- User satisfaction >80%

---

## Glossary

| Term | Definition |
|------|------------|
| **OKR** | Objectives and Key Results - Strategic quarterly goals |
| **KR** | Key Result - Measurable outcome with base/target/current |
| **BAU** | Business As Usual - Ongoing operational work |
| **KPI** | Key Performance Indicator - BAU metric |
| **Monthly Heads-Up** | Monthly plan container with description |
| **Work Item** | Monthly deliverable linked to KR or BAU |
| **Weekly Priority Plan** | Weekly plan container with focus |
| **P1/P2/P3** | Priority levels: Critical / Important / Nice to have |
| **Task** | Individual work assignment |

---

**Document Status:** Final - Ready for Implementation  
**Version:** 1.0  
**Company:** Cooperative Bank of Oromia  
**Product:** Compass

---

**END OF SPECIFICATION**