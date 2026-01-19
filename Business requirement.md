# Business Requirements: Team Performance & Execution System

## 1. Executive Summary

This document defines the business requirements for a **Team Performance & Execution System** designed for banking organizations. The system tracks team-level performance across two parallel tracks:

1. **OKRs (Objectives & Key Results)** - Strategic/transformational goals
2. **BAU (Business As Usual)** - Operational health metrics

The system provides clear measurement of progress, performance, and health metrics, enabling executives to monitor both strategy execution and operational stability.

---

## 2. Business Problem

Banking teams need to balance:
- **Strategic work** (new initiatives, transformations) 
- **Operational work** (keeping systems running, serving customers)

Current challenges:
- No unified view of team performance
- OKRs tracked separately from daily operations
- Difficult to measure operational health alongside strategic progress
- Weekly planning disconnected from quarterly goals
- Executives lack visibility into team capacity and performance

---

## 3. Business Objectives

1. **Unified Performance View** - Single system tracking both OKRs and BAU
2. **Clear Accountability** - Work items linked to goals, tasks assigned to individuals
3. **Weekly Execution Cadence** - Monday planning, Friday measurement
4. **Real-time Visibility** - Executives can see team performance at any time
5. **Data-Driven Decisions** - Progress and health calculated automatically

---

## 4. Core Entities

| Entity | Description | Purpose |
|--------|-------------|---------|
| **Team** | Group of employees working together | Organizational unit for tracking |
| **OKR** | Quarterly objective with key results | Strategic goals for transformation |
| **Key Result** | Measurable outcome for an objective | Specific target to achieve |
| **BAU Activity** | Ongoing operational responsibility | Area of operational excellence |
| **BAU Metric** | Quantitative health indicator | Measure of operational health (SLA, uptime, etc.) |
| **Work Item** | Monthly deliverable from OKR or BAU | Executable unit of work |
| **Weekly Priority** | P1/P2 assignment for the week | Focus for weekly execution |
| **Task** | Atomic unit assigned to individual | Daily actionable item |

---

## 5. System Flow

```
QUARTERLY          MONTHLY             WEEKLY              DAILY              WEEKLY
  SETUP          HEADS-UP            PLANNING           EXECUTION          MEASUREMENT
    ↓                ↓                   ↓                  ↓                  ↓
  OKRs +       Work Items         Priorities           Tasks            Progress &
BAU Setup     (monthly plan)    (weekly focus)    (task updates)         Health
```

**Critical Flow:** Quarterly → **Monthly** → Weekly → Daily → Measurement

### 5.1 Quarterly Planning (Once per Quarter)
- Define quarterly OKRs with key results
- Set up BAU activities with target metrics
- Establish baseline for the quarter
- **This sets the strategy**

### 5.2 Monthly Heads-Up (Critical Step - Start of Each Month)
**This is the bridge between strategy and execution**

- **What:** Create work items for the upcoming month
- **From Where:** 
  - OKR key results (strategic work items)
  - BAU activities (maintenance/improvement work items)
- **Details:** Each work item includes:
  - Name and description
  - Link to source (which KR or BAU activity)
  - Owner (who's responsible)
  - Expected outcome
- **Cadence:** Primary planning happens at month start, ad-hoc items can be added mid-month
- **Output:** List of work items ready for weekly prioritization

**Example Monthly Heads-Up:**
```
January 2026 Work Items:

FROM OKRs:
1. Migrate authentication service (from KR1)
2. Implement auto-failover for DB (from KR2)
3. Research API gateway vendors (from KR3)

FROM BAU:
4. Deploy January security patches (System Reliability)
5. Update incident runbooks (Incident Management)
6. Quarterly DR plan review (System Reliability)

Total: 6 work items planned for January
```

### 5.3 Weekly Planning (Every Monday)
**This is where monthly work items get prioritized and broken down**

- **Input:** Available work items from monthly heads-up
- **Process:**
  - Review work items
  - Assign weekly priorities (P1, P2, P3)
  - Break prioritized work items into tasks
  - Assign tasks to team members
- **Output:** Week's execution plan with tasks

**Key Point:** Work items are created monthly, but prioritized weekly. Not all monthly work items need to be worked on every week.

### 5.4 Daily Execution
- Team members work on assigned tasks
- Update task status as work progresses
- Flag blockers and dependencies

### 5.5 Weekly Measurement (Every Friday)
- Calculate OKR progress from task completion
- Update BAU metrics (manual or automated)
- Review team performance
- Identify risks and issues
- Prepare for next Monday's planning

---

## 6. OKR Performance Measurement

### 6.1 Measurement Approach
OKRs are measured through **task-driven progress**:
- Work items link to key results
- Tasks break down work items
- Task completion drives progress calculation

### 6.2 Calculation Logic

**Task Completion:**
```
Task Progress = 1 if Done, else 0
```

**Work Item Progress:**
```
Work Item Progress = (Completed Tasks / Total Tasks) × 100%
```

**Key Result Progress:**
```
KR Progress = Average(Work Item Progress for all work items linked to KR)
```

**OKR Progress:**
```
OKR Progress = Average(KR Progress for all key results)
```

### 6.3 Example

```
OKR: Modernize Core Banking
├─ KR1: Migrate 5 services to cloud
│  └─ Work Item: Migrate authentication service
│     ├─ Task 1: Setup AWS ✓ Done
│     ├─ Task 2: Configure DB ✓ Done
│     ├─ Task 3: Migrate data ⏳ In Progress
│     ├─ Task 4: Update APIs ⚪ Not Started
│     └─ Task 5: Test ⚪ Not Started
│     
│     Work Item Progress: 2/5 = 40%
│     KR1 Progress: 40% (one work item)
│     
├─ KR2: Reduce downtime by 50%
│  └─ (No work items this month)
│     KR2 Progress: 0%
│
└─ KR3: Deploy API gateway
   └─ (No work items this month)
      KR3 Progress: 0%

OKR Progress: (40% + 0% + 0%) / 3 = 13%
```

---

## 7. BAU Performance Measurement

### 7.1 Measurement Approach
BAU is measured through **outcome metrics**, not task completion:
- Metrics define operational health (SLA, uptime, accuracy)
- Work items support metric improvement but don't define health
- Health calculated from actual metric values vs. targets

### 7.2 Standard BAU Metrics for Banking

| BAU Area | Metric | Formula | Target Example |
|----------|--------|---------|----------------|
| **Incident Management** | SLA Adherence | (Tickets within SLA ÷ Total Tickets) × 100 | 95% |
| **Incident Management** | MTTR | Average resolution time | 30 minutes |
| **System Reliability** | Uptime | (Actual uptime ÷ Total time) × 100 | 99.9% |
| **System Reliability** | Error Rate | (Errors ÷ Total requests) × 100 | <0.5% |
| **Transaction Processing** | Accuracy | (Correct ÷ Total) × 100 | 99.9% |
| **Customer Support** | First Response Time | Average time to first response | 2 hours |
| **Customer Support** | CSAT | Customer satisfaction score | 90% |

### 7.3 Calculation Logic

**Metric Achievement:**
```
For metrics where higher is better (uptime, accuracy):
Achievement = (Current Value / Target Value) × 100%

For metrics where lower is better (MTTR, error rate):
Achievement = (Target Value / Current Value) × 100%

Cap achievement at 100%
```

**BAU Activity Health:**
```
Health = Σ(Metric Achievement × Metric Weight) / Σ(Metric Weight)
```

**Team BAU Health:**
```
Team BAU Health = Average(BAU Activity Health for all activities)
```

### 7.4 Example

```
BAU Activity: Incident Management

Metrics:
├─ SLA Adherence
│  Target: 95%, Current: 91%, Weight: 50%
│  Achievement: (91 / 95) × 100 = 95.8%
│
└─ MTTR
   Target: 30 min, Current: 35 min, Weight: 50%
   Achievement: (30 / 35) × 100 = 85.7%

Activity Health = (95.8% × 0.5) + (85.7% × 0.5) = 90.8%
```

### 7.5 Work Items vs. Metrics

**Important Distinction:**
- **BAU Metrics** = Source of truth for operational health
- **BAU Work Items** = Planned improvements to support metrics

Example:
```
BAU Activity: System Reliability
├─ Metrics (measured continuously):
│  ├─ Uptime: 99.6% (Target: 99.9%) 🟡
│  └─ Error Rate: 0.3% (Target: <0.5%) ✓
│
└─ Work Items (planned this month):
   ├─ Deploy security patches
   └─ Implement auto-failover
   
   → Work items help improve metrics
   → But health = metric values, not task completion
```

---

## 8. Prioritization & Scheduling

### 8.1 The Three-Tier Cadence

**Monthly → Weekly → Daily**

```
MONTHLY HEADS-UP (1st of each month)
├─ Create work items from OKRs and BAU
├─ Assign owners
└─ Work items go into "monthly backlog"
      ↓
WEEKLY PLANNING (Every Monday)
├─ Pick work items from monthly backlog
├─ Assign priorities (P1, P2, P3)
├─ Break into tasks
└─ Tasks become the week's execution plan
      ↓
DAILY EXECUTION (Monday-Friday)
├─ Team works on tasks
└─ Updates task status
      ↓
WEEKLY REVIEW (Every Friday)
├─ Measure progress
└─ Close completed work items
```

### 8.2 Monthly Heads-Up Details

**Timing:** First few days of each month  
**Participants:** Team Lead + key team members  
**Duration:** 1-2 hours  

**Agenda:**
1. Review quarterly OKRs - what needs progress this month?
2. Review BAU activities - what maintenance/improvements needed?
3. Create work items:
   - From OKRs: Which KRs need attention?
   - From BAU: What planned work supports our metrics?
4. Assign owners to work items
5. Document expected outcomes

**Output:** 5-10 work items for the month

**Example:**
```
Monthly Heads-Up: January 2026
Attendees: Sarah (Lead), John, Mike

OKR Progress Review:
- KR1 (Migrate 5 services): 0/5 done → Need to start
- KR2 (Reduce downtime): 4 hours → Need auto-failover
- KR3 (API gateway): 0% → Start vendor research

BAU Review:
- System Reliability: Uptime good, need patches deployed
- Incident Management: SLA slipping, need runbook updates

Work Items Created:
1. Migrate authentication service → John (OKR - KR1)
2. Migrate payment service → Sarah (OKR - KR1)  
3. Implement DB auto-failover → Mike (OKR - KR2)
4. Evaluate API gateway vendors → Sarah (OKR - KR3)
5. Deploy January security patches → Mike (BAU - Reliability)
6. Update incident runbooks → John (BAU - Incident Mgmt)

Total: 6 work items for January
```

### 8.3 Weekly Planning Details

**Timing:** Every Monday morning  
**Participants:** Entire team  
**Duration:** 30-60 minutes  

**Agenda:**
1. Review last week's completion
2. Look at available work items (from monthly heads-up)
3. Assign priorities for THIS week:
   - P1: Must complete this week (2-3 items max)
   - P2: Should complete if capacity allows (2-3 items)
   - P3: Nice to have (1-2 items)
4. Break P1 and P2 items into tasks
5. Assign tasks to individuals

**Important:** Not all monthly work items are worked on every week. Some items may wait 2-3 weeks before being prioritized.

**Example:**
```
Weekly Planning: Week of Jan 8

Available Work Items (from January heads-up):
☐ Migrate authentication service
☐ Migrate payment service
☐ Implement DB auto-failover
☐ Evaluate API gateway vendors
☐ Deploy security patches
☐ Update incident runbooks

This Week's Priorities:
P1: Migrate authentication service
    Tasks:
    - Setup AWS infrastructure (John, 4h)
    - Configure DB connection (Sarah, 6h)
    - Migrate user data (Mike, 8h)
    - Update API endpoints (Sarah, 4h)
    - Run integration tests (John, 4h)

P1: Deploy security patches
    Tasks:
    - Review patch notes (Mike, 2h)
    - Test in staging (Mike, 4h)
    - Deploy to production (Mike, 2h)

P2: Update incident runbooks
    Tasks:
    - Review outdated runbooks (John, 3h)
    - Update top 5 runbooks (John, 5h)

Remaining items (not prioritized this week):
- Migrate payment service → Next week
- Implement DB auto-failover → Week 3
- Evaluate API gateway vendors → Week 3
```

### 8.4 Priority Levels

- **P1 (Priority 1)**: Must complete this week, critical path
  - Maximum 2-3 P1 items per week
  - Team commits to completing these
  - Blocked P1s escalated immediately

- **P2 (Priority 2)**: Should complete this week if capacity allows
  - 2-3 P2 items per week
  - Nice to have, but can slip to next week

- **P3 (Priority 3)**: Optional, only if extra capacity
  - 1-2 P3 items per week
  - Low priority improvements

### 8.5 Task Assignment Guidelines

- **Task size:** 2-8 hours of work (completable in 1-2 days)
- **Task ownership:** One person per task (clear accountability)
- **Task dependencies:** Flag blockers explicitly
- **Task status:** Updated daily by assignee

### 8.6 Capacity Planning

- Track team capacity vs. committed work
- Account for BAU reactive work (incidents, support)
- Leave buffer for unplanned work (typically 20-30%)
- System should alert if team is over-committed

### 8.7 Mid-Month Adjustments

**Ad-hoc Work Items:**
- Can be created mid-month as needs arise
- Added to monthly backlog
- Prioritized in next weekly planning

**Re-prioritization:**
- Team Lead can adjust priorities mid-week
- Major changes discussed with team
- System tracks priority history

---

## 9. Reporting & Analytics

### 9.1 Executive Dashboard
**CEO/Executive View:**
- Team OKR progress (percentage)
- Team BAU health (percentage)
- Week-over-week trends
- At-risk items flagged
- Team capacity utilization

### 9.2 Team Lead Dashboard
**Team Lead View:**
- Detailed OKR progress by KR
- BAU health by activity and metric
- Work item status
- Task completion by team member
- Blockers and risks

### 9.3 Team Member View
**Individual Contributor View:**
- My assigned tasks
- Work items I own
- My contribution to OKRs/BAU
- Task history and performance

### 9.4 Trending & History
- Weekly performance over time
- Metric trends (improving/degrading)
- OKR progress trajectory
- Predictive completion estimates

---

## 10. User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Executive** | View all teams, dashboards, reports. Read-only. |
| **Team Lead** | Create/edit OKRs, BAU, work items. Assign priorities. View team performance. |
| **Team Member** | Update task status. View assigned work. View team dashboard. |
| **Admin** | Manage users, teams, system configuration. |

---

## 11. Key Performance Indicators (KPIs)

### 11.1 System Success Metrics
- **Adoption Rate**: % of teams using the system weekly
- **Data Quality**: % of tasks updated within 24 hours
- **Planning Efficiency**: Time spent on Monday planning
- **Measurement Accuracy**: % of OKRs with realistic progress

### 11.2 Team Performance Metrics
- **OKR Progress Rate**: Average % progress per week
- **BAU Health Score**: Average health across all activities
- **Task Completion Rate**: % of committed tasks completed
- **Blocker Resolution Time**: Average time to resolve blockers

---

## 12. Success Criteria

The system is successful when:

1. **Visibility**: Executives can see team performance in < 1 minute
2. **Efficiency**: Weekly planning takes < 30 minutes
3. **Accuracy**: Progress reflects reality (validated by team)
4. **Adoption**: 80%+ of teams use it consistently
5. **Value**: Decisions are made using system data

---

## 13. Out of Scope (for MVP)

The following are explicitly NOT included in the initial version:
- Cross-team dependencies
- Resource allocation across teams
- Budget tracking
- Time tracking / timesheets
- Project portfolio management
- Integration with HR systems
- Mobile apps (web-responsive only)
- Advanced analytics / AI predictions

---

## 14. Assumptions & Constraints

### 14.1 Assumptions
- Teams have weekly planning meetings
- Team members can update tasks daily
- BAU metrics can be entered manually or via API
- One team uses the system initially (pilot)

### 14.2 Constraints
- Must be web-based (accessible via browser)
- Must support 1-10 teams initially
- Must load dashboards in < 2 seconds
- Must be deployable on standard cloud infrastructure

---

## 15. Glossary

| Term | Definition |
|------|------------|
| **OKR** | Objectives and Key Results - quarterly goal-setting framework |
| **BAU** | Business As Usual - ongoing operational work |
| **Work Item** | A deliverable created from OKR or BAU, completed in a month |
| **Task** | Smallest unit of work, completed in hours/days |
| **Priority** | P1/P2/P3 designation for weekly focus |
| **KR** | Key Result - measurable outcome for an objective |
| **Health Score** | 0-100% metric indicating BAU operational health |
| **MTTR** | Mean Time To Resolve - average incident resolution time |
| **SLA** | Service Level Agreement - target for service delivery |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-19 | System Architect | Initial version |

---

**End of Business Requirements Document**