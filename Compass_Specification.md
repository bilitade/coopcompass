# Compass
## Team Performance Tracking System

**Company:** Cooperative Bank of Oromia  
**Version:** 1.0 Final  
**Date:** February 2026  
**Document Type:** Implementation Specification

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [System Actors](#3-system-actors)
4. [Core Entities](#4-core-entities)
5. [Measurement Standards](#5-measurement-standards)
6. [Workflow & Execution](#6-workflow--execution)
7. [User Interfaces](#7-user-interfaces)
8. [AI Engine (Future)](#8-ai-engine-future)
9. [Technical Requirements](#9-technical-requirements)
10. [Validation Criteria](#10-validation-criteria)

---

## 1. Problem Statement

### 1.1 Background

Cooperative Bank of Oromia is one of the biggest private banks in Ethiopia with:
- Multiple departments (IT, Finance, Retail, Corporate, Loans, etc.)
- Multiple teams within each department
- Numerous retail branches across Ethiopia

### 1.2 Current Challenges

**Strategic Tracking (OKR):**
- No automated platform to track progress toward bank's strategic goals
- Manual, time-consuming reporting process
- Difficult for executives to get timely information for decision-making

**Operational Tracking (BAU):**
- Business-as-usual work incorrectly reported as strategic OKRs
- No clear distinction between strategic work and operational work
- No standardized way to measure operational performance

**Visibility & Accountability:**
- No seamless visibility into team work toward goals
- False reports, not factual
- Hard to trace what work contributes to which goal
- Low transparency across the organization

**Impact:**
- Executives cannot make timely, informed decisions
- Teams unclear on priorities
- Inaccurate performance assessment
- Wasted time on manual reporting

### 1.3 Solution Required

An automated, seamless platform to:
1. Track and measure **OKR progress** (strategic goals) at team level
2. Track and measure **BAU performance** (operational work) at team level
3. Manage and assign **tasks** with clean reporting
4. Provide **visibility** to executives, directors, and managers
5. Enable **factual, timely reporting** without manual effort

---

## 2. Solution Overview

### 2.1 What Compass Does

**Compass** is a team performance tracking system that connects:

```
OKRs (Strategy) ────────┐
                        ├──→ Work Items ──→ Tasks ──→ Execution
BAU (Operations) ───────┘
```

**Key Capabilities:**

1. **OKR Management** - Quarterly strategic goals with weighted Key Results
2. **BAU Management** - Operational activities with KPI metrics
3. **Work Planning** - Monthly and weekly work item prioritization
4. **Task Management** - Individual task assignment and tracking
5. **Automated Measurement** - Weekly snapshots and reporting
6. **Role-Based Dashboards** - Different views for different stakeholders

### 2.2 Core Principle

```
MEASUREMENT (What Determines Scores)
├─ OKR: Measured by Key Result metric values (base, target, current)
└─ BAU: Measured by KPI metric values (target, current)

EXECUTION (Work Management)
├─ Work Items: Link work to OKR/BAU
├─ Tasks: Individual assignments
└─ Purpose: Visibility and accountability
```

**Important:** Tasks show work being done, but scores come from actual metric values entered by Manager.

---

## 3. System Actors

### 3.1 User Roles

| Role | Responsibilities | Access Level |
|------|------------------|--------------|
| **Admin** | System configuration, user management, team/department setup | Full system access |
| **Manager/Team Lead** | Manage, plan, update OKRs and BAU. Create work items and tasks. Update metric values. | Own team: Create, Read, Update, Delete |
| **Team Member** | Execute assigned tasks, update task status | Own tasks: Read, Update |
| **Director** | View department-wide performance, all teams in department | Department: Read-only |
| **Executive** | View bank-wide performance, all departments and teams | Bank-wide: Read-only |
| **AI Engine** (Future) | Generate suggestions for work items, priorities, tasks, insights | N/A |

### 3.2 Organizational Structure

```
Cooperative Bank of Oromia (Bank)
│
├─ Department: IT & Digital Banking (Director: X)
│  ├─ Team: Core Banking (Manager: A) → 6 members
│  ├─ Team: Digital Channels (Manager: B) → 5 members
│  └─ Team: Cybersecurity (Manager: C) → 4 members
│
├─ Department: Retail Banking (Director: Y)
│  ├─ Team: Addis Branch (Manager: D) → 12 members
│  ├─ Team: Bahir Dar Branch (Manager: E) → 8 members
│  └─ Team: Hawassa Branch (Manager: F) → 10 members
│
├─ Department: Corporate Banking (Director: Z)
│  └─ Teams...
│
└─ Department: Loan Operations (Director: W)
   └─ Teams...
```

**Key Points:**
- Each team has 1 Manager/Team Lead
- Each department has 1 Director
- Team members belong to exactly 1 team
- Retail branches are treated as teams

---

## 4. Core Entities

### 4.1 OKR (Objectives and Key Results)

**Objective**
- Team
- Quarter (Q1, Q2, Q3, Q4 of year)
- Objective statement (what to achieve)
- Contains: 2-5 Key Results

**Key Result (KR) - The Metric**
- Description
- **Base**: Starting value (baseline at quarter start)
- **Target**: Goal value (to achieve by quarter end)
- **Current**: Actual progress (Manager updates weekly)
- **Unit**: Measurement unit (customers, Birr, %, count, services, etc.)
- **Weight**: Importance (0.0-1.0, must sum to 1.0 per Objective)
- **Score**: Auto-calculated (0.0-1.0)

**Formula:**
```
KR Score = (current - base) / (target - base)
Capped between 0.0 and 1.0

Objective Score = SUM(KR Score × KR Weight)
```

**Example:**
```
Objective: "Expand Retail Banking Footprint" (Q1 2026)

KR1: "Increase active customers from 500,000 to 750,000"
  Base: 500,000
  Target: 750,000
  Current: 625,000 (Manager updates this weekly)
  Unit: customers
  Weight: 0.4 (40%)
  Score: (625,000 - 500,000) / (750,000 - 500,000) = 125,000/250,000 = 0.50

KR2: "Increase deposits from 800M to 1.2B Birr"
  Base: 800,000,000
  Target: 1,200,000,000
  Current: 1,050,000,000
  Unit: Birr
  Weight: 0.6 (60%)
  Score: (1,050M - 800M) / (1,200M - 800M) = 250M/400M = 0.625

Objective Score: (0.50 × 0.4) + (0.625 × 0.6) = 0.20 + 0.375 = 0.575
Status: Yellow (target is 0.70)
```

### 4.2 BAU (Business As Usual)

**BAU Activity**
- Team
- Activity name (e.g., "Branch Operations", "System Reliability")
- Description
- Contains: 1-5 BAU Metrics (KPIs)

**BAU Metric (KPI)**
- Metric name
- **Target**: Goal value
- **Current**: Actual value (Manager updates weekly)
- **Unit**: Measurement unit (%, minutes, hours, count, etc.)
- **Weight**: Importance (0.0-1.0, must sum to 1.0 per Activity)
- **Type**: "Higher is Better" OR "Lower is Better"
- **Achievement**: Auto-calculated (0-100%)

**Formula:**
```
IF type = "Higher is Better":
  Achievement = (current / target) × 100, capped at 100

IF type = "Lower is Better":
  Achievement = (target / current) × 100, capped at 100

Activity Score = SUM(Metric Achievement × Metric Weight)

Overall BAU Health = AVERAGE(All Activity Scores)
```

**Example:**
```
BAU Activity: "Branch Operations"

Metric 1: "Transaction Accuracy" (Higher is Better)
  Target: 99.9%
  Current: 99.95%
  Unit: %
  Weight: 0.5
  Achievement: (99.95 / 99.9) × 100 = 100.05, capped at 100%

Metric 2: "Average Wait Time" (Lower is Better)
  Target: 5 minutes
  Current: 4.2 minutes
  Unit: minutes
  Weight: 0.5
  Achievement: (5 / 4.2) × 100 = 119, capped at 100%

Activity Score: (100 × 0.5) + (100 × 0.5) = 100%
```

### 4.3 Work Item

**Work Item**
- Title and description
- **Source Type**: "OKR" or "BAU"
- **Source ID**: Which Key Result or BAU Activity
- **Month**: 2026-01, 2026-02, etc.
- **Owner**: Manager/Team Lead (always)
- Status: Not Started / In Progress / Completed

**Purpose:** Represents planned work for the month that will contribute to OKR or BAU improvement.

**Example:**
```
Work Item: "Launch Customer Acquisition Campaign"
Source Type: OKR
Source ID: KR1 (Increase customers 500K → 750K)
Month: 2026-02
Owner: Tigist Bekele (Manager)
Status: In Progress

This work item contains tasks that will help achieve KR1,
but the KR score comes from actual customer count, not task completion.
```

### 4.4 Weekly Priority

**Weekly Priority**
- Work Item reference
- **Week**: 2026-W01, 2026-W02, etc. (ISO week format)
- **Priority Level**:
  - **P1 (Critical)**: Must complete this week
  - **P2 (Important)**: Should complete if capacity allows
  - **P3 (Nice to Have)**: Optional, if extra capacity

**Purpose:** Prioritizes which work items to focus on each week.

### 4.5 Task

**Task**
- Description
- Work Item reference
- **Assigned To**: Team Member
- **Status**: Not Started / In Progress / Done / Blocked
- Estimated hours
- Created date, completed date

**Purpose:** Individual work assignments for team members.

**Important:** Tasks are for execution tracking only. They do NOT determine OKR/BAU scores.

---

## 5. Measurement Standards

### 5.1 OKR Measurement

**Key Result Score:**
```
KR Score = (current_value - base_value) / (target_value - base_value)

Constraints:
- If score < 0: score = 0.0
- If score > 1: score = 1.0
- Score range: 0.0 to 1.0
```

**Objective Score:**
```
Objective Score = SUM(KR Score × KR Weight)

Where:
- All KR weights must sum to 1.0
- Score range: 0.0 to 1.0
```

**Status Bands (Aspirational OKRs):**

| Score | Status | Color | Meaning |
|-------|--------|-------|---------|
| 0.7 - 1.0 | Green | 🟢 | On track or ahead |
| 0.4 - 0.6 | Yellow | 🟡 | At risk, needs attention |
| 0.0 - 0.3 | Red | 🔴 | Off track, requires intervention |

**Weekly Progress Benchmarks (for 13-week quarter):**

| Week | Expected Range | Status |
|------|----------------|--------|
| Week 2 | 0.05 - 0.15 | 🟢 |
| Week 4 | 0.15 - 0.35 | 🟢 |
| Week 7 | 0.40 - 0.60 | 🟢 |
| Week 10 | 0.60 - 0.80 | 🟢 |
| Week 13 | 0.70 - 1.0 | 🟢 |

### 5.2 BAU Measurement

**Metric Achievement:**
```
IF metric.type = "Higher is Better":
  achievement = (current_value / target_value) × 100
  IF achievement > 100: achievement = 100

IF metric.type = "Lower is Better":
  achievement = (target_value / current_value) × 100
  IF achievement > 100: achievement = 100
```

**Activity Score:**
```
Activity Score = SUM(Metric Achievement × Metric Weight)

Where:
- All metric weights must sum to 1.0 per activity
- Score range: 0-100%
```

**Overall BAU Health:**
```
BAU Health = AVERAGE(All BAU Activity Scores for team)

Score range: 0-100%
```

**Status Bands:**

| Score | Status | Color | Meaning |
|-------|--------|-------|---------|
| 95-100% | Excellent | 🟢 | Outstanding performance |
| 90-94% | Good | 🟢 | Strong performance |
| 85-89% | Acceptable | 🟡 | Meets minimum standards |
| 80-84% | Warning | 🟡 | Needs improvement |
| <80% | Poor | 🔴 | Requires immediate action |

---

## 6. Workflow & Execution

### 6.1 Quarterly Cycle Overview

```
Quarter Start (Week 1)
    ↓
Quarterly Planning: Setup OKRs and BAU
    ↓
Month 1, Week 1: Monthly Heads-Up #1
    ↓
Weeks 2-4: Weekly Planning + Execution
    ↓
Month 2, Week 5: Monthly Heads-Up #2
    ↓
Weeks 6-9: Weekly Planning + Execution
    ↓
Month 3, Week 10: Monthly Heads-Up #3
    ↓
Weeks 11-13: Weekly Planning + Execution
    ↓
Quarter End: Review and Planning for Next Quarter
```

### 6.2 Quarterly Planning (Week 1 of Quarter)

**Who:** Manager/Team Lead  
**When:** First week of Q1/Q2/Q3/Q4  
**Duration:** 2-3 hours (one-time per quarter)

**Steps:**

1. **Create Objective** for the quarter
   - Write objective statement
   - Select quarter (Q1 2026, Q2 2026, etc.)

2. **Add 2-5 Key Results** with:
   - Description (what to measure)
   - Base value (current baseline)
   - Target value (goal to achieve)
   - Unit (customers, Birr, %, etc.)
   - Weight (must sum to 1.0)

3. **Create BAU Activities** (if new or changed)
   - Activity name
   - Description

4. **Add 1-5 KPIs per BAU Activity** with:
   - Metric name
   - Target value
   - Unit
   - Weight (must sum to 1.0 per activity)
   - Type (Higher/Lower is Better)

**Output:** Team's quarterly OKRs and BAU structure established.

### 6.3 Monthly Heads-Up (First Monday of Each Month)

**Who:** Manager/Team Lead  
**When:** First Monday of month (Week 1, 5, 10 of quarter)  
**Duration:** 30-45 minutes

**Purpose:** Plan the month's work to improve OKR or BAU performance.

**Steps:**

1. **Review OKR Progress:**
   - Which KRs are behind target?
   - What work is needed this month?

2. **Review BAU Performance:**
   - Which KPIs are below target?
   - What operational work is needed?

3. **Create 5-10 Work Items:**
   - Link each to specific KR (for OKR work)
   - Or link to BAU Activity (for BAU work)
   - Write title, description, expected outcome
   - Set month (e.g., 2026-02)

4. **AI Assistance** (future):
   - System suggests work items based on gaps
   - Manager can accept, edit, or reject suggestions

**Output:** 5-10 work items planned for the month, linked to OKRs or BAU.

**Example:**
```
Monthly Heads-Up: February 2026
Team: Retail Banking - Addis Branch

OKR Analysis:
- KR1 (Customers) at 0.40, needs 0.60 by month end → Needs work
- KR2 (Deposits) at 0.625, on track → Maintain

BAU Analysis:
- Transaction Accuracy: 99.95% (excellent)
- Wait Time: 6.5min, target <5min → Needs improvement

Work Items Created:
1. "Launch referral program" → KR1 (Customers)
2. "Open Bole sub-branch" → KR1 (Customers)
3. "Optimize teller workflow" → BAU (Branch Operations, Wait Time)
4. "Train 5 new tellers" → BAU (Branch Operations)
5. "Monthly system maintenance" → BAU (System Reliability)
```

### 6.4 Weekly Planning (Every Monday)

**Who:** Manager/Team Lead  
**When:** Every Monday morning  
**Duration:** 20-30 minutes

**Purpose:** Prioritize work for the week and create tasks.

**Steps:**

1. **Review Last Week:**
   - What was completed?
   - What's still pending?

2. **View Available Work Items:**
   - From this month's heads-up
   - Work items not yet completed

3. **Prioritize for This Week:**
   - **P1 (Critical)**: 2-3 work items that must be done
   - **P2 (Important)**: 2-3 work items if capacity allows
   - **P3 (Nice to Have)**: 1-2 optional items

4. **Create Tasks:**
   - For each P1 and P2 work item
   - Break down into 3-8 tasks
   - Assign each task to team member
   - Set estimated hours

5. **Check Capacity:**
   - System shows team capacity
   - Warns if overcommitted

6. **AI Assistance** (future):
   - Suggests P1/P2/P3 priorities
   - Generates task breakdown
   - Recommends assignments

**Output:** Week's priorities set, tasks assigned.

**Example:**
```
Weekly Planning: Monday, Feb 10, 2026
Team: Retail Banking - Addis Branch

Available Work Items (from February heads-up):
☐ Launch referral program
☐ Open Bole sub-branch
☐ Optimize teller workflow
☐ Train new tellers
☐ System maintenance

This Week's Priorities:

P1 (Must Do):
- Launch referral program
  Tasks:
  • Design campaign materials (Hanna, 6h)
  • Train branch staff (Sara, 4h)
  • Launch campaign (Tigist, 2h)
  
- System maintenance
  Tasks:
  • Backup databases (John, 2h)
  • Apply security patches (John, 3h)
  • Test systems (Mike, 2h)

P2 (Should Do):
- Optimize teller workflow
  Tasks:
  • Map current process (Tigist, 3h)
  • Identify bottlenecks (Sara, 2h)
  • Implement changes (Hanna, 4h)

Capacity: 120 hours (6 people × 40h × 50% availability)
Committed: 28 hours (23%)
Status: ✓ Healthy
```

### 6.5 Daily Execution (Monday-Thursday)

**Who:** Team Members  
**When:** Throughout the week

**Steps:**

1. View assigned tasks
2. Work on tasks
3. Update task status:
   - Not Started → In Progress
   - In Progress → Done
   - Flag if Blocked
4. Add comments if needed

**Output:** Tasks progress throughout week.

### 6.6 Weekly Measurement (Friday)

**Who:** Manager/Team Lead + System Automation  
**When:** Every Friday afternoon (or Monday morning)  
**Duration:** 10-15 minutes for Manager

**Manager Actions:**

1. **Update KR Current Values:**
   - Check actual customer count → Enter in system
   - Check actual deposits → Enter in system
   - Check actual revenue → Enter in system
   - Check actual service count → Enter in system
   - For each KR, enter current actual value

2. **Update BAU KPI Current Values:**
   - Check actual uptime → Enter in system
   - Check actual transaction accuracy → Enter in system
   - Check actual wait time → Enter in system
   - Check actual error rate → Enter in system
   - For each KPI, enter current actual value

**System Actions (Automated):**

1. Calculate all KR scores
2. Calculate Objective score
3. Determine OKR status (Green/Yellow/Red)
4. Calculate all BAU metric achievements
5. Calculate all BAU activity scores
6. Calculate overall BAU health
7. Determine BAU status
8. Create weekly snapshot (save all current values)
9. Generate weekly reports
10. Send notifications to relevant stakeholders

**Output:**
- All scores updated
- Weekly snapshot saved in database
- Reports generated
- Notifications sent

**Example Friday Update:**
```
Manager Updates (Friday, Feb 14, 2026):

KR1: Increase customers 500K → 750K
  Previous: 625,000
  Current: 640,000 (from CRM system)
  Score: (640K - 500K) / (750K - 500K) = 0.56 ✓ Updated

KR2: Increase deposits 800M → 1.2B
  Previous: 1,050M
  Current: 1,080M (from finance report)
  Score: (1,080M - 800M) / (1,200M - 800M) = 0.70 ✓ Updated

BAU - Transaction Accuracy:
  Previous: 99.95%
  Current: 99.96% (from system logs)
  Achievement: 100% ✓ Updated

BAU - Wait Time:
  Previous: 6.5 minutes
  Current: 5.8 minutes (from queue system)
  Achievement: (5 / 5.8) × 100 = 86.2% ✓ Updated

System auto-calculates:
- Objective Score: 0.632 (was 0.575)
- Overall BAU Health: 93.1% (was 93.0%)
- Snapshot saved
- Report generated
- Notifications sent
```

---

## 7. User Interfaces

### 7.1 Manager/Team Lead Dashboard

```
┌──────────────────────────────────────────────────────────┐
│ RETAIL BANKING - ADDIS BRANCH                            │
│ Q1 2026, Week 7 | Manager: Tigist Bekele                 │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ OKR PROGRESS                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Expand Retail Banking Footprint: 0.63 🟡                │
│ Target: 0.70 | Expected (Week 7): 0.40-0.60 | Ahead! ✓  │
│                                                           │
│ KR1 (Weight: 40%): Customers 500K → 750K                │
│   Current: 640,000 | Score: 0.56 🟡                     │
│   Progress: +15K this week                               │
│   [Update Current Value]                                 │
│                                                           │
│ KR2 (Weight: 60%): Deposits 800M → 1.2B Birr            │
│   Current: 1,080M | Score: 0.70 🟢                      │
│   Progress: +30M this week                               │
│   [Update Current Value]                                 │
│                                                           │
│ OVERALL BAU HEALTH: 93% 🟢 Good                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                           │
│ Branch Operations: 96% 🟢                                │
│ ├─ Transaction Accuracy: 99.96% (T: 99.9%) 🟢           │
│ └─ Wait Time: 5.8min (T: <5min) 🟡 Improving            │
│ [Update KPIs]                                            │
│                                                           │
│ Customer Service: 90% 🟢                                 │
│ ├─ CSAT: 83% (T: 85%) 🟡                                │
│ └─ First Response: 1.5h (T: <2h) 🟢                     │
│ [Update KPIs]                                            │
│                                                           │
│ THIS WEEK'S WORK (Week 7)                                │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ P1: Launch referral program - 3/3 tasks ✓ Completed     │
│ P1: System maintenance - 3/3 tasks ✓ Completed          │
│ P2: Optimize teller workflow - 2/3 tasks ⏳ In Progress │
│                                                           │
│ Team Capacity: 28/120 hours (23%) ✓ Healthy             │
│                                                           │
│ [Monthly Heads-Up] [Weekly Planning] [View Reports]      │
└──────────────────────────────────────────────────────────┘
```

### 7.2 Director Dashboard

```
┌──────────────────────────────────────────────────────────┐
│ RETAIL BANKING DEPARTMENT                                │
│ Q1 2026, Week 7 | Director: Alemayehu Tadesse           │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ DEPARTMENT PERFORMANCE                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Teams: 5 | Avg OKR: 0.64 🟡 | Avg BAU: 92% 🟢          │
│                                                           │
│ TEAM SUMMARY                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                           │
│ Addis Branch (Mgr: Tigist)                              │
│ OKR: 0.63 🟡 | BAU: 93% 🟢 | Status: ✅ On Track       │
│ └─ Ahead of Week 7 target (0.40-0.60)                   │
│                                                           │
│ Bahir Dar Branch (Mgr: Kebede)                          │
│ OKR: 0.72 🟢 | BAU: 91% 🟢 | Status: ✅ Excellent      │
│ └─ Exceeding targets                                     │
│                                                           │
│ Hawassa Branch (Mgr: Sara)                              │
│ OKR: 0.48 🟡 | BAU: 89% 🟢 | Status: ⚠️ Review Needed  │
│ └─ Within range but lower end                           │
│                                                           │
│ Mekelle Branch (Mgr: Hanna)                             │
│ OKR: 0.66 🟡 | BAU: 94% 🟢 | Status: ✅ On Track       │
│ └─ Progressing well                                      │
│                                                           │
│ Dire Dawa Branch (Mgr: Abebe)                           │
│ OKR: 0.68 🟡 | BAU: 92% 🟢 | Status: ✅ On Track       │
│ └─ Good progress                                         │
│                                                           │
│ ITEMS FOR ATTENTION                                      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ ⚠️ Hawassa: Review with manager on improvement plan     │
│                                                           │
│ [View Team Details] [Trends] [Export Report]            │
└──────────────────────────────────────────────────────────┘
```

### 7.3 Executive Dashboard

```
┌──────────────────────────────────────────────────────────┐
│ COOPERATIVE BANK OF OROMIA                               │
│ Q1 2026, Week 7 | Friday, February 14, 2026             │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ BANK-WIDE PERFORMANCE                                    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Departments: 4 | Teams: 18 | Employees: 156             │
│ Average OKR: 0.66 🟡 | Average BAU: 91% 🟢             │
│                                                           │
│ DEPARTMENT PERFORMANCE                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                           │
│ IT & Digital Banking (3 teams)                          │
│ OKR: 0.72 🟢 | BAU: 95% 🟢                             │
│ Status: ✅ Excellent - Leading the bank                 │
│                                                           │
│ Retail Banking (5 teams)                                │
│ OKR: 0.64 🟡 | BAU: 92% 🟢                             │
│ Status: ✅ On Track - 1 team needs review               │
│                                                           │
│ Corporate Banking (4 teams)                              │
│ OKR: 0.69 🟡 | BAU: 89% 🟢                             │
│ Status: ✅ On Track - Solid performance                 │
│                                                           │
│ Loan Operations (6 teams)                               │
│ OKR: 0.59 🟡 | BAU: 87% 🟢                             │
│ Status: ⚠️ Review - 2 teams below expected range        │
│                                                           │
│ STRATEGIC INSIGHTS                                       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ ✓ 15/18 teams on track for Q1 OKR targets (83%)        │
│ ✓ All departments above 85% BAU health                  │
│ ⚠️ 3 teams require management attention                 │
│ ✓ Bank trending toward 0.70 target (feasible with push) │
│                                                           │
│ WEEK-OVER-WEEK TRENDS                                    │
│ OKR: +0.03 ↑ | BAU: +1% ↑ | Momentum: Positive         │
│                                                           │
│ [View Department Details] [Export Bank Report] [Trends]  │
└──────────────────────────────────────────────────────────┘
```

### 7.4 Team Member View

```
┌──────────────────────────────────────────────────┐
│ MY TASKS - Week of Feb 10, 2026                 │
│ Hanna Tesfaye | Retail Banking - Addis Branch   │
├──────────────────────────────────────────────────┤
│                                                   │
│ P1 TASKS (Critical - Must Complete)              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                   │
│ ☑ Design campaign materials (6h)                 │
│   Work Item: Launch referral program             │
│   Status: Done ✓                                 │
│   Completed: Feb 12, 2026                        │
│                                                   │
│ P2 TASKS (Important - If Capacity)               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                   │
│ ☐ Implement workflow changes (4h)                │
│   Work Item: Optimize teller workflow            │
│   Status: In Progress ⏳                         │
│   [Mark as Done] [Add Comment] [Flag Blocker]    │
│                                                   │
│ MY PROGRESS THIS WEEK                            │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Completed: 1/2 tasks (50%)                       │
│ Hours: 6/10 estimated                            │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## 8. AI Engine (Future Integration)

### 8.1 AI Capabilities

**Work Item Generation:**
- Analyzes OKR gaps (which KRs are behind)
- Identifies BAU metrics below target
- Suggests 5-10 work items for monthly heads-up
- Manager can accept, edit, or reject

**Priority Recommendations:**
- Analyzes work item urgency
- Considers team capacity
- Recommends P1/P2/P3 for weekly planning
- Manager has final decision

**Task Breakdown:**
- Generates standard tasks from work item description
- Suggests task assignments based on skills
- Estimates hours based on historical data
- Manager can modify before finalizing

**Insights & Alerts:**
- "KR2 behind trend, unlikely to hit target"
- "BAU metric declining for 3 consecutive weeks"
- "Team capacity at 85%, consider reducing P2 items"
- "Similar teams averaging 0.75, consider best practices"

### 8.2 AI Architecture (Future)

```
Compass System
      ↓
AI Engine API
      ↓
├─ Work Item Suggester (ML Model)
├─ Priority Recommender (Rule Engine + ML)
├─ Task Generator (Template Matching + NLP)
└─ Insights Generator (Pattern Recognition)
```

**Note:** AI features are for future implementation. Core system works without AI.

---

## 9. Technical Requirements

### 9.1 Data Model Summary

**Core Tables:**

| Table | Key Fields | Purpose |
|-------|------------|---------|
| Department | id, name | Organizational unit |
| Team | id, name, department_id | Work unit |
| User | id, name, email, role, team_id | System actors |
| OKR | id, team_id, quarter, objective | Strategic goals |
| KeyResult | id, okr_id, description, base, target, current, unit, weight | Measurable outcomes |
| BAUActivity | id, team_id, name, description | Operational areas |
| BAUMetric | id, bau_activity_id, name, target, current, unit, weight, type | KPIs |
| WorkItem | id, source_type, source_id, month, title, owner_id, status | Monthly work |
| WeeklyPriority | id, work_item_id, week, priority | P1/P2/P3 assignments |
| Task | id, work_item_id, assignee_id, description, status, hours | Individual work |
| WeeklySnapshot | id, week, team_id, okr_scores, bau_scores, timestamp | Historical data |

### 9.2 Critical Calculations

**Implement these formulas:**

```python
# KR Score
def calculate_kr_score(base, target, current):
    if target == base:
        return 1.0 if current >= target else 0.0
    score = (current - base) / (target - base)
    return max(0.0, min(1.0, score))  # Clamp to [0.0, 1.0]

# Objective Score
def calculate_objective_score(key_results):
    weighted_sum = sum(kr.score * kr.weight for kr in key_results)
    return weighted_sum

# BAU Metric Achievement
def calculate_metric_achievement(metric):
    if metric.type == "Higher is Better":
        achievement = (metric.current / metric.target) * 100
    else:  # Lower is Better
        achievement = (metric.target / metric.current) * 100
    return min(achievement, 100)  # Cap at 100%

# BAU Activity Score
def calculate_activity_score(metrics):
    weighted_sum = sum(m.achievement * m.weight for m in metrics)
    return weighted_sum

# Overall BAU Health
def calculate_bau_health(activities):
    return sum(a.score for a in activities) / len(activities)
```

### 9.3 Weekly Snapshot Job

**Runs:** Every Friday at 5:00 PM

**Process:**
1. For each team:
   - Capture all KR current values and scores
   - Capture all BAU metric current values and achievements
   - Capture objective score
   - Capture overall BAU health
   - Save to WeeklySnapshot table
2. Generate reports
3. Send notifications

### 9.4 Role-Based Access Control

**Implement these rules:**

```python
def can_access_team(user, team_id):
    if user.role == "admin":
        return True
    if user.role == "executive":
        return True
    if user.role == "director":
        team = get_team(team_id)
        return team.department_id == user.department_id
    if user.role in ["manager", "member"]:
        return user.team_id == team_id
    return False

def can_edit_team(user, team_id):
    if user.role == "admin":
        return True
    if user.role == "manager":
        return user.team_id == team_id
    return False

def can_update_task(user, task):
    if user.role == "admin":
        return True
    if user.role == "manager" and user.team_id == task.team_id:
        return True
    if user.id == task.assignee_id:
        return True
    return False
```

### 9.5 Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| Page load | <2 seconds | For all dashboards |
| API response | <500ms | For data queries |
| Concurrent users | 200+ | Peak usage |
| Weekly snapshot | <10 minutes | Batch job for all teams |
| Database queries | <100ms | With proper indexes |

---

## 10. Validation Criteria

### 10.1 For Business Team

**OKR Functionality:**
- [ ] Can create OKR with 2-5 Key Results
- [ ] KR weights sum to 1.0 (system validates)
- [ ] KR score calculates correctly: (current - base) / (target - base)
- [ ] Objective score calculates correctly: SUM(KR score × weight)
- [ ] Green/Yellow/Red status displays correctly
- [ ] Score updates when Manager enters new current value
- [ ] Score does NOT change when tasks are completed

**BAU Functionality:**
- [ ] Can create BAU activity with 1-5 metrics
- [ ] Metric weights sum to 1.0 (system validates)
- [ ] Metric achievement calculates correctly (Higher/Lower is Better)
- [ ] Activity score calculates correctly: SUM(achievement × weight)
- [ ] Overall BAU health calculates correctly: AVERAGE(activities)
- [ ] Score updates when Manager enters new current value

**Workflow:**
- [ ] Can create work items linked to KR or BAU Activity
- [ ] Can prioritize work items as P1/P2/P3
- [ ] Can create tasks from work items
- [ ] Can assign tasks to team members
- [ ] Team members can update task status
- [ ] Weekly snapshot captures all data on Friday

**Reporting:**
- [ ] Weekly reports generate automatically
- [ ] Reports show correct OKR and BAU scores
- [ ] Historical trends visible from snapshots
- [ ] Executives can view bank-wide data
- [ ] Directors can view department data
- [ ] Managers can view team data

### 10.2 For Engineering Team

**Data Integrity:**
- [ ] KR weights validated to sum to 1.0
- [ ] BAU metric weights validated to sum to 1.0
- [ ] Work items must link to valid KR or BAU Activity
- [ ] Tasks must link to valid Work Item
- [ ] Cannot delete KR if work items exist (or cascade properly)
- [ ] User can only belong to one team

**Calculations:**
- [ ] KR score formula implemented correctly
- [ ] Objective score formula implemented correctly
- [ ] BAU metric achievement formula (both types) correct
- [ ] BAU activity score formula correct
- [ ] Overall BAU health formula correct
- [ ] Scores clamped to valid ranges

**Access Control:**
- [ ] Admin can access everything
- [ ] Manager can only edit own team
- [ ] Team member can only update own tasks
- [ ] Director can view own department (read-only)
- [ ] Executive can view all (read-only)
- [ ] Proper error messages for unauthorized access

**Performance:**
- [ ] Dashboard loads in <2 seconds
- [ ] Snapshot job completes in <10 minutes for 20 teams
- [ ] Database queries optimized with indexes
- [ ] No N+1 query problems

### 10.3 Acceptance Criteria

**System is ready when:**
- [ ] All validation criteria pass
- [ ] Pilot with 4 teams successful (1 full quarter)
- [ ] Managers report time savings vs manual process
- [ ] Executives confirm data is timely and accurate
- [ ] No critical bugs
- [ ] User satisfaction >80%

---

## 11. Glossary

| Term | Definition |
|------|------------|
| **OKR** | Objectives and Key Results - Strategic quarterly goals |
| **Objective** | What the team wants to achieve this quarter |
| **Key Result (KR)** | Measurable outcome with base, target, current, unit, weight |
| **BAU** | Business As Usual - Ongoing operational work |
| **BAU Activity** | Area of operational responsibility |
| **KPI** | Key Performance Indicator - BAU metric |
| **Work Item** | Monthly planned work linked to KR or BAU Activity |
| **Weekly Priority** | P1/P2/P3 designation for work items |
| **Task** | Individual work assignment |
| **Snapshot** | Weekly capture of all scores and values |
| **Quarter** | 13-week period (Q1, Q2, Q3, Q4) |
| **Week** | ISO week format (2026-W01, 2026-W02, etc.) |

---

## 12. Summary

### What Compass Delivers

**For Managers:**
- Clear quarterly goals (OKRs)
- Structured planning (monthly, weekly)
- Automated scoring (no manual calculations)
- Clean task management

**For Directors:**
- Department-wide visibility
- Team performance comparison
- Early identification of at-risk teams
- Factual data for decisions

**For Executives:**
- Bank-wide performance view
- Timely information
- Strategic vs operational clarity
- Data-driven decision support

**For the Bank:**
- Automated, seamless tracking
- Factual reporting (no false data)
- Clear OKR vs BAU distinction
- Execution visibility
- Reduced manual effort
- Timely strategic information

---

**Document Status:** Final Specification - Ready for Implementation  
**Version:** 1.0  
**Date:** February 2026  
**Company:** Cooperative Bank of Oromia  
**Product:** Compass

---

**END OF SPECIFICATION**
