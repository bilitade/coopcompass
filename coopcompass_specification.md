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

## 10. Performance Monitoring

### 10.1 Overview

Compass monitors team performance at three levels: weekly, monthly, and quarterly. All monitoring is built on a single data source: **weekly snapshots**.

### 10.2 Weekly Snapshot

**Purpose:** Capture comprehensive performance data and full context for generating meaningful reports and analysis.

**Frequency:** Automated every Friday at 5:00 PM

**Storage Schema:**
```sql
CREATE TABLE weekly_snapshots (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id),
    week VARCHAR(8) NOT NULL,
    quarter VARCHAR(7) NOT NULL,
    
    -- Team Context
    team_name VARCHAR(255),
    team_size INT,
    manager_id INT,
    manager_name VARCHAR(255),
    team_members JSONB,
    
    -- OKR Context & Scores
    okr_id INT,
    okr_objective TEXT,
    okr_target_score DECIMAL(3,2),
    okr_current_score DECIMAL(3,2),
    okr_key_results JSONB,
    
    -- BAU Context & Scores
    bau_activities JSONB,
    bau_overall_health DECIMAL(5,2),
    
    -- Work Items (Planned & Completed)
    work_items_planned JSONB,
    work_items_completed JSONB,
    work_items_count_planned INT,
    work_items_count_completed INT,
    
    -- Weekly Priority Plan
    weekly_priority_plan JSONB,
    
    -- Tasks
    tasks JSONB,
    tasks_count_planned INT,
    tasks_count_completed INT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    snapshot_version VARCHAR(10) DEFAULT '1.0',
    
    UNIQUE(team_id, week)
);
```

**JSONB Field Structures:**

**team_members:**
```json
[{"id": 12, "name": "Tigist Bekele", "role": "Manager"}]
```

**okr_key_results:**
```json
[{
  "id": 3,
  "description": "Increase customers 500K → 750K",
  "base": 500000,
  "target": 750000,
  "current": 640000,
  "unit": "customers",
  "weight": 0.4,
  "score": 0.56
}]
```

**bau_activities:**
```json
[{
  "id": 10,
  "name": "Branch Operations",
  "score": 96,
  "metrics": [{
    "name": "Transaction Accuracy",
    "target": 99.9,
    "current": 99.95,
    "achievement": 100
  }]
}]
```

**work_items_planned:**
```json
[{
  "id": 101,
  "title": "Launch university partnership",
  "source_type": "OKR",
  "source_name": "KR1: Increase customers",
  "priority": "P1"
}]
```

**weekly_priority_plan:**
```json
{
  "week_focus": "Launch campaign and maintenance",
  "p1_items": [{"id": 101, "title": "..."}]
}
```

**tasks:**
```json
[{
  "id": 501,
  "description": "Design materials",
  "assignee": "Hanna Tesfaye",
  "status": "Done"
}]
```
### 10.3 Weekly Monitoring

**Purpose:** Track week-to-week progress and detect immediate issues.

**Timing:** Every Friday after snapshot capture

**Metrics Tracked:**

| Metric | Calculation | Interpretation |
|--------|-------------|----------------|
| OKR Change | Current - Previous | Weekly velocity |
| BAU Change | Current - Previous | Operational trend |
| Work Item Rate | This week completion % | Delivery discipline |
| Task Rate | This week completion % | Execution discipline |

**Example Weekly Comparison:**

```
WEEK 7 vs WEEK 6 COMPARISON

OKR Progress:
├─ Week 6: 0.45
├─ Week 7: 0.56
└─ Change: +0.11 ↗️ (Accelerating)

BAU Health:
├─ Week 6: 95%
├─ Week 7: 96%
└─ Change: +1% → (Stable)

Work Items:
├─ Week 6: 67% completion (2 of 3)
├─ Week 7: 100% completion (2 of 2)
└─ Improvement: +33% ✓

Tasks:
├─ Week 6: 67% completion (8 of 12)
├─ Week 7: 100% completion (5 of 5)
└─ Improvement: +33% ✓

Insight:
Week 7 showed strong execution (100% completion) 
and best OKR growth (+0.11). Team planned optimal 
workload (2 P1 items vs Week 6's 3 P1 items).
```

### 10.4 Monthly Monitoring

**Purpose:** Evaluate if monthly plan is working and identify strategy adjustments.

**Timing:** On-demand or automatic at month-end

**Data Source:** Aggregates 4 weeks of snapshots

**Monthly Summary Structure:**

```
JANUARY 2026 SUMMARY
Team: Retail Banking - Addis Branch

OKR Performance:
├─ Start (Week 1): 0.40
├─ End (Week 4): 0.56
├─ Change: +0.16
├─ Average Velocity: 0.04 per week
└─ Status: On track

BAU Performance:
├─ Average Health: 98%
└─ Status: Excellent

Execution:
├─ Work Items Completed: 5
├─ Average Completion: 92%
├─ Tasks Completed: 20
└─ Average Completion: 88%

Weekly Breakdown:
├─ Week 1: OKR 0.40 | Work 100% | Tasks 85%
├─ Week 2: OKR 0.45 | Work 100% | Tasks 90%
├─ Week 3: OKR 0.50 | Work 100% | Tasks 95%
└─ Week 4: OKR 0.56 | Work 67% | Tasks 83%

Trend: Accelerating OKR growth
```

### 10.5 Quarterly Monitoring

**Purpose:** Assess final OKR achievement and generate learnings for next quarter.

**Timing:** End of quarter (after Week 13)

**Data Source:** Aggregates all 13 weeks of snapshots

**Quarterly Review Structure:**

```
Q1 2026 QUARTERLY REVIEW
Team: Retail Banking - Addis Branch

Final Achievement:
├─ Objective: "Expand Customer Base"
├─ Target Score: 0.70
├─ Final Score: 0.73 🟢
└─ Achievement: 104% (Exceeded target)

Key Results:
├─ KR1 (Customers): 0.68 (68% achieved)
├─ KR2 (Deposits): 0.85 (85% achieved)
└─ Weighted Score: 0.73

BAU Performance:
├─ Average Health: 94%
└─ Status: Consistently strong

Execution Discipline:
├─ Work Items: 15 completed (91% avg)
├─ Tasks: 65 completed (87% avg)
└─ Assessment: Good consistency

Quarter Trajectory:
├─ Month 1: 0.00 → 0.35 | Velocity: 0.09/week
├─ Month 2: 0.35 → 0.58 | Velocity: 0.08/week
└─ Month 3: 0.58 → 0.73 | Velocity: 0.06/week
```

### 10.6 Data Retention

**Storage Policy:**

| Data Type | Retention | Purpose |
|-----------|-----------|---------|
| Weekly Snapshots | Permanent | Historical analysis |
| Monthly Summaries | Not stored | Calculated on-demand |
| Quarterly Reviews | Not stored | Calculated on-demand |

**Storage Estimate:**
- Per team per quarter: ~26KB (13 weeks × 2KB)
- For 500 teams: ~13MB per quarter
- Annual: ~52MB (negligible)

### 10.7 Access Control

**Monitoring Visibility:**

| Role | Weekly | Monthly | Quarterly | Scope |
|------|--------|---------|-----------|-------|
| Manager | ✓ | ✓ | ✓ | Own team only |
| Team Member | ✓ Summary | ✗ | ✗ | Own team only |
| Director | ✓ | ✓ | ✓ | Own department |
| Executive | ✓ | ✓ | ✓ | All teams |
| Admin | ✓ | ✓ | ✓ | All teams |

---

## 11. AI Engine (Future)

**Capabilities:**
- Suggest work items based on OKR/BAU gaps
- Recommend weekly priorities based on urgency
- Generate task breakdowns from work items
- Alert on at-risk OKRs/BAU metrics

**Note:** Core system works without AI. AI enhances efficiency.

---

## 12. Validation Criteria

### 12.1 Business Team

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

### 12.2 Engineering Team

**Must Implement:**
- [ ] All formulas correctly
- [ ] Data constraints (weights sum to 1.0)
- [ ] Role-based access control
- [ ] Weekly snapshot job (Friday 5pm)
- [ ] Real-time score updates
- [ ] P1 validation (min 1, max 3)

---

## 13. Success Criteria

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
| **Weekly Snapshot** | Automated capture of all performance data every Friday |

---

**Document Status:** Final - Ready for Implementation  
**Version:** 1.0  
**Company:** Cooperative Bank of Oromia  
**Product:** Compass

---

**END OF SPECIFICATION**