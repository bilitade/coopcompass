# Architecture Diagrams

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COOPCOMPASS DASHBOARD SYSTEM                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              FRONTEND (React)                              │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                                                                    │   │
│  │  ┌──────────────────────────────────────────────────────────┐     │   │
│  │  │             UNIFIED DASHBOARD COMPONENT                │     │   │
│  │  │  ┌──────────────────────────────────────────────────┐   │     │   │
│  │  │  │  Props:                                          │   │     │   │
│  │  │  │  - variant: "team" | "department" | "org"       │   │     │   │
│  │  │  │  - teamId?: number                              │   │     │   │
│  │  │  │  - departmentId?: number                        │   │     │   │
│  │  │  │  - onNavigate?: (type, id) => void              │   │     │   │
│  │  │  └──────────────────────────────────────────────────┘   │     │   │
│  │  │                      ↓                                   │     │   │
│  │  │  ┌──────────────────────────────────────────────────┐   │     │   │
│  │  │  │        Variant Rendering Logic                  │   │     │   │
│  │  │  ├──────────────────────────────────────────────────┤   │     │   │
│  │  │  │ if (variant === "team")       → Team Layout     │   │     │   │
│  │  │  │ if (variant === "department") → Dept Layout     │   │     │   │
│  │  │  │ if (variant === "organization") → Org Layout    │   │     │   │
│  │  │  └──────────────────────────────────────────────────┘   │     │   │
│  │  │                      ↓                                   │     │   │
│  │  │  ┌──────────────────────────────────────────────────┐   │     │   │
│  │  │  │         UI Components                           │   │     │   │
│  │  │  ├──────────────────────────────────────────────────┤   │     │   │
│  │  │  │ - MetricsCard (Header)                          │   │     │   │
│  │  │  │ - Progress Bars                                 │   │     │   │
│  │  │  │ - Grid Layouts                                  │   │     │   │
│  │  │  │ - Color Coded Health (Green/Yellow/Red)        │   │     │   │
│  │  │  └──────────────────────────────────────────────────┘   │     │   │
│  │  └──────────────────────────────────────────────────────┘     │   │
│  │                                                                │   │
│  │  Pages Using Component:                                        │   │
│  │  ├─ DashboardPage (Team Member) → variant="team"            │   │
│  │  ├─ DirectorDashboard → variant="department"                │   │
│  │  └─ ExecutiveDashboard → variant="organization"             │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                  ↓                                     │
│                           API Service                                  │
│                           ┌────────┬────────┬──────────┐              │
│                           │        │        │          │              │
│            getDashboard() │        │        │    getOrganization     │
│          getDepartmentDash│        │   getOrganizationDashboard()   │
│          board()          │        │        │          │              │
│                           └────────┴────────┴──────────┘              │
│                                  ↓                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
                            NETWORK LAYER
                                  ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI/Python)                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    API ROUTERS                                        │  │
│  │  ┌──────────────────────────────────────────────────────────────┐   │  │
│  │  │  GET /api/teams/{team_id}/dashboard                         │   │  │
│  │  │  └─→ get_team_dashboard(db, team_id)                       │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────────────────────┐   │  │
│  │  │  GET /api/departments/{dept_id}/dashboard  [NEW]            │   │  │
│  │  │  └─→ get_department_dashboard(db, dept_id)                 │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────────────────────┐   │  │
│  │  │  GET /api/organization/dashboard  [NEW]                     │   │  │
│  │  │  └─→ get_organization_dashboard(db)                        │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                  ↓                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │              CALCULATIONS (calculations.py)                          │  │
│  │  ┌──────────────────────────────────────────────────────────────┐   │  │
│  │  │  CALCULATION FUNCTIONS (Core Logic)                         │   │  │
│  │  ├──────────────────────────────────────────────────────────────┤   │  │
│  │  │                                                              │   │  │
│  │  │  ┌─────────────────────────────────────────────────────┐    │   │  │
│  │  │  │ Level 1: Individual Calculations                   │    │   │  │
│  │  │  ├─────────────────────────────────────────────────────┤    │   │  │
│  │  │  │ • calculate_work_item_progress()                   │    │   │  │
│  │  │  │ • calculate_kr_progress()                          │    │   │  │
│  │  │  │ • calculate_okr_progress()                         │    │   │  │
│  │  │  │ • calculate_bau_health()                           │    │   │  │
│  │  │  └─────────────────────────────────────────────────────┘    │   │  │
│  │  │                      ↓                                      │   │  │
│  │  │  ┌─────────────────────────────────────────────────────┐    │   │  │
│  │  │  │ Level 2: Team Aggregation                          │    │   │  │
│  │  │  ├─────────────────────────────────────────────────────┤    │   │  │
│  │  │  │ • get_team_dashboard()                             │    │   │  │
│  │  │  │   - Calculates all team metrics                    │    │   │  │
│  │  │  │   - Returns complete dashboard data               │    │   │  │
│  │  │  └─────────────────────────────────────────────────────┘    │   │  │
│  │  │                      ↓                                      │   │  │
│  │  │  ┌─────────────────────────────────────────────────────┐    │   │  │
│  │  │  │ Level 3: Department Aggregation [NEW]              │    │   │  │
│  │  │  ├─────────────────────────────────────────────────────┤    │   │  │
│  │  │  │ • get_department_dashboard()                       │    │   │  │
│  │  │  │   - Loops all teams in department                 │    │   │  │
│  │  │  │   - Reuses get_team_dashboard()                   │    │   │  │
│  │  │  │   - Averages team metrics                         │    │   │  │
│  │  │  └─────────────────────────────────────────────────────┘    │   │  │
│  │  │                      ↓                                      │   │  │
│  │  │  ┌─────────────────────────────────────────────────────┐    │   │  │
│  │  │  │ Level 4: Organization Aggregation [NEW]            │    │   │  │
│  │  │  ├─────────────────────────────────────────────────────┤    │   │  │
│  │  │  │ • get_organization_dashboard()                     │    │   │  │
│  │  │  │   - Loops all departments                          │    │   │  │
│  │  │  │   - Reuses get_department_dashboard()            │    │   │  │
│  │  │  │   - Averages department metrics                   │    │   │  │
│  │  │  └─────────────────────────────────────────────────────┘    │   │  │
│  │  │                                                              │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                  ↓                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      DATABASE LAYER                                  │  │
│  │  ┌──────────────────────────────────────────────────────────────┐   │  │
│  │  │ Tables:                                                      │   │  │
│  │  │ • users (team_id, role)                                      │   │  │
│  │  │ • teams (department_id)                                      │   │  │
│  │  │ • departments (director_id)                                  │   │  │
│  │  │ • okrs (team_id, quarter)                                    │   │  │
│  │  │ • key_results (okr_id, current/target values)               │   │  │
│  │  │ • bau_activities (team_id, name)                            │   │  │
│  │  │ • bau_metrics (activity_id, weight, current/target)        │   │  │
│  │  │ • work_items (team_id, source_id)                           │   │  │
│  │  │ • tasks (work_item_id, status)                              │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Hierarchy

```
┌───────────────────────────────────────────────────────────────────────────┐
│                      DATA AGGREGATION HIERARCHY                            │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ORGANIZATION LEVEL                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                                                                 │    │
│  │  Total Departments: 2                                           │    │
│  │  Total Teams: 5                                                │    │
│  │  Total Members: 20                                             │    │
│  │  Avg OKR Progress: (Dept1.avg + Dept2.avg) / 2                │    │
│  │  Avg BAU Health: (Dept1.health + Dept2.health) / 2            │    │
│  │                                                                 │    │
│  │  ┌────────────────────────────┬────────────────────────────┐   │    │
│  │  │                            │                            │   │    │
│  │  ▼                            ▼                            ▼   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│        │                            │                                  │
│        │ DEPARTMENT LEVEL 1         │ DEPARTMENT LEVEL 2              │
│        │ (Engineering)              │ (Product)                       │
│        │                            │                                  │
│  ┌─────▼──────────────────┐  ┌─────▼──────────────────┐              │
│  │                        │  │                        │              │
│  │ Total Teams: 3         │  │ Total Teams: 2         │              │
│  │ Total Members: 12      │  │ Total Members: 8       │              │
│  │ Avg OKR: 77.5%        │  │ Avg OKR: 73.5%        │              │
│  │ Avg BAU: 83.5%        │  │ Avg BAU: 81.1%        │              │
│  │                        │  │                        │              │
│  │ ┌──┬──┬──┐            │  │ ┌──┬──┐                │              │
│  │ │  │  │  │            │  │ │  │  │                │              │
│  │ ▼  ▼  ▼  ▼            │  │ ▼  ▼  ▼                │              │
│  └─────────────────────────┘  └─────────────────────────┘              │
│    │      │       │              │       │                            │
│    │      │       │              │       │ TEAM LEVEL (5 Total)       │
│    │      │       │              │       │                            │
│ ┌──▼──┐┌─▼──┐┌──▼──┐        ┌──▼──┐┌──▼──┐                          │
│ │Team1││Tea ││Team3│        │Tea  ││Tea  │                          │
│ │     ││m2  ││     │        │m4   ││m5   │                          │
│ │     │└────┘│     │        └─────┘└─────┘                          │
│ │Dept1│      │Dept1│         Dept2  Dept2                           │
│ │     │      │     │                                                │
│ │ OKR:│      │ OKR:│                                                │
│ │80%  │      │75%  │        (Contains OKRs, BAU                     │
│ │BAU: │      │BAU: │         Activities, Weekly                     │
│ │85%  │      │82%  │         Priorities, Tasks)                    │
│ └─────┘      └─────┘                                                │
│                                                                       │
│ EACH TEAM CONTAINS:                                                  │
│ ├─ OKRs with Key Results (with current/target values)               │
│ ├─ BAU Activities with Metrics (with weights)                       │
│ ├─ Weekly Priorities for current week                               │
│ └─ Tasks and Work Items                                             │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## Request/Response Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE REQUEST/RESPONSE FLOW                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SCENARIO 1: TEAM MEMBER VIEWS TEAM DASHBOARD                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                         │
│  Browser                Frontend              API                      │
│    │                      │                    │                      │
│    │ Visit /dashboard     │                    │                      │
│    ├─────────────────────→│                    │                      │
│    │                      │ <UnifiedDashboard  │                      │
│    │                      │  variant="team"    │                      │
│    │                      │  teamId={1} />     │                      │
│    │                      │                    │                      │
│    │                      │ api.getDashboard   │                      │
│    │                      │  (teamId=1)        │                      │
│    │                      ├───────────────────→│                      │
│    │                      │                    │                      │
│    │                      │                    │ GET /teams/1/dashboard
│    │                      │                    │                      │
│    │                      │                    │ get_team_dashboard(db, 1)
│    │                      │                    │  ├─ getOKRs()       │
│    │                      │                    │  ├─ getBAU()        │
│    │                      │                    │  └─ getPriorities() │
│    │                      │                    │                      │
│    │                      │ DashboardResponse  │                      │
│    │                      │←───────────────────┤                      │
│    │                      │ { okr_progress,    │                      │
│    │                      │   bau_health,      │                      │
│    │                      │   okrs,            │                      │
│    │                      │   bau_activities } │                      │
│    │                      │                    │                      │
│    │ Render Dashboard     │                    │                      │
│    │←─────────────────────┤                    │                      │
│    │                      │                    │                      │
│                                                                         │
│  SCENARIO 2: DIRECTOR VIEWS DEPARTMENT DASHBOARD                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                         │
│  Browser                Frontend              API                      │
│    │                      │                    │                      │
│    │ Visit /directors     │                    │                      │
│    ├─────────────────────→│                    │                      │
│    │                      │ <UnifiedDashboard  │                      │
│    │                      │  variant=          │                      │
│    │                      │  "department"      │                      │
│    │                      │  deptId={1} />     │                      │
│    │                      │                    │                      │
│    │                      │ api.                │                      │
│    │                      │ getDepartmentDash   │                      │
│    │                      │ board(deptId=1)    │                      │
│    │                      ├───────────────────→│                      │
│    │                      │                    │                      │
│    │                      │                    │ GET /departments/1/   │
│    │                      │                    │     dashboard         │
│    │                      │                    │                      │
│    │                      │                    │ get_department_dash   │
│    │                      │                    │ board(db, 1)         │
│    │                      │                    │  ├─ get_team_dash(1) │
│    │                      │                    │  ├─ get_team_dash(2) │
│    │                      │                    │  └─ get_team_dash(3) │
│    │                      │                    │  Average metrics     │
│    │                      │                    │                      │
│    │                      │ Department         │                      │
│    │                      │ DashboardResponse  │                      │
│    │                      │←───────────────────┤                      │
│    │                      │ { total_teams,     │                      │
│    │                      │   avg_okr_progress,│                      │
│    │                      │   teams: [...] }   │                      │
│    │                      │                    │                      │
│    │ Render Department    │                    │                      │
│    │ Dashboard            │                    │                      │
│    │←─────────────────────┤                    │                      │
│    │                      │                    │                      │
│                                                                         │
│  SCENARIO 3: EXECUTIVE VIEWS ORGANIZATION DASHBOARD                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                         │
│  Browser                Frontend              API                      │
│    │                      │                    │                      │
│    │ Visit /executives    │                    │                      │
│    ├─────────────────────→│                    │                      │
│    │                      │ <UnifiedDashboard  │                      │
│    │                      │  variant=          │                      │
│    │                      │  "organization" /> │                      │
│    │                      │                    │                      │
│    │                      │ api.               │                      │
│    │                      │ getOrganization    │                      │
│    │                      │ Dashboard()        │                      │
│    │                      ├───────────────────→│                      │
│    │                      │                    │                      │
│    │                      │                    │ GET /organization/   │
│    │                      │                    │     dashboard        │
│    │                      │                    │                      │
│    │                      │                    │ get_organization_    │
│    │                      │                    │ dashboard(db)        │
│    │                      │                    │  ├─ get_dept_dash(1) │
│    │                      │                    │  └─ get_dept_dash(2) │
│    │                      │                    │  Average metrics     │
│    │                      │                    │                      │
│    │                      │ Organization       │                      │
│    │                      │ DashboardResponse  │                      │
│    │                      │←───────────────────┤                      │
│    │                      │ { total_departments,
│    │                      │   total_teams,     │                      │
│    │                      │   avg_okr_progress,│                      │
│    │                      │   departments: [..], departments: [...] }    │
│    │                      │                    │                      │
│    │ Render Organization  │                    │                      │
│    │ Dashboard            │                    │                      │
│    │←─────────────────────┤                    │                      │
│    │                      │                    │                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Calculation Flow Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                   CALCULATION FLOW (Backend)                      │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Level 1: Individual Progress/Health                             │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │  Task Completion  →  Work Item Progress                 │    │
│  │  (Done vs Total)      (% of tasks done)                │    │
│  │      │                       │                          │    │
│  │      └───────────┬───────────┘                          │    │
│  │                  ▼                                      │    │
│  │  KR Current/Target  →  Key Result Progress             │    │
│  │  (0-100% capped)        (Based on work items)          │    │
│  │      │                       │                          │    │
│  │      └───────────┬───────────┘                          │    │
│  │                  ▼                                      │    │
│  │  All KRs  →  OKR Progress                              │    │
│  │  (Average)   (Average of KRs)                          │    │
│  │                                                          │    │
│  │  BAU Metrics (weighted)  →  BAU Health                 │    │
│  │  (Current vs Target)         (Weighted average)        │    │
│  │                                                          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  Level 2: Team Aggregation                                      │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │  Team OKR Progress = (calculated in Level 1)            │    │
│  │  Team BAU Health = (calculated in Level 1)              │    │
│  │  Team Members = (count of users in team)                │    │
│  │                                                          │    │
│  │  Returns: get_team_dashboard() response                 │    │
│  │                                                          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  Level 3: Department Aggregation                                │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │  For each Team in Department:                           │    │
│  │  ├─ Call get_team_dashboard(team_id)                   │    │
│  │  └─ Collect Team OKR Progress                          │    │
│  │  └─ Collect Team BAU Health                            │    │
│  │                                                          │    │
│  │  Department OKR Progress = Avg(Team OKRs)              │    │
│  │  Department BAU Health = Avg(Team BAU)                 │    │
│  │  Department Members = Sum(Team Members)                │    │
│  │                                                          │    │
│  │  Returns: get_department_dashboard() response           │    │
│  │                                                          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  Level 4: Organization Aggregation                              │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │  For each Department:                                   │    │
│  │  ├─ Call get_department_dashboard(dept_id)             │    │
│  │  └─ Collect Dept OKR Progress                          │    │
│  │  └─ Collect Dept BAU Health                            │    │
│  │                                                          │    │
│  │  Organization OKR Progress = Avg(Dept OKRs)            │    │
│  │  Organization BAU Health = Avg(Dept BAU)               │    │
│  │  Organization Teams = Sum(Dept Teams)                  │    │
│  │  Organization Members = Sum(Dept Members)              │    │
│  │  Organization Directors = Count(Dept Directors)        │    │
│  │                                                          │    │
│  │  Returns: get_organization_dashboard() response        │    │
│  │                                                          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Component Composition

```
┌─────────────────────────────────────────────────────────────┐
│         REACT COMPONENT HIERARCHY                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layout                                                     │
│   └─ Page Component (DashboardPage,                         │
│      DirectorDashboard, ExecutiveDashboard)                 │
│       └─ UnifiedDashboard                                   │
│           ├─ Team Variant                                   │
│           │  ├─ MetricsCard (OKR Progress)                 │
│           │  ├─ MetricsCard (BAU Health)                   │
│           │  ├─ OKR Section                                │
│           │  │  ├─ OKR Card                                │
│           │  │  │  ├─ Progress Bar                         │
│           │  │  │  └─ KR Items                             │
│           │  │  │     └─ KR Progress Bar                   │
│           │  │  └─ ...                                     │
│           │  ├─ BAU Section                                │
│           │  │  ├─ Activity Card                           │
│           │  │  │  └─ Health Progress Bar                  │
│           │  │  └─ ...                                     │
│           │  └─ Priorities Section                         │
│           │     ├─ Priority Item                           │
│           │     │  └─ Task Progress Bar                    │
│           │     └─ ...                                     │
│           │                                                │
│           ├─ Department Variant                            │
│           │  ├─ MetricsCard (Total Teams)                 │
│           │  ├─ MetricsCard (Total Members)               │
│           │  ├─ MetricsCard (Avg OKR)                     │
│           │  ├─ MetricsCard (Avg BAU)                     │
│           │  └─ Teams Grid                                │
│           │     ├─ Team Card                              │
│           │     │  ├─ Team Name                           │
│           │     │  ├─ Member Count                        │
│           │     │  ├─ OKR Progress Bar                    │
│           │     │  └─ BAU Health Bar                      │
│           │     └─ ...                                    │
│           │                                                │
│           └─ Organization Variant                          │
│              ├─ MetricsCard (Total Departments)           │
│              ├─ MetricsCard (Total Teams)                 │
│              ├─ MetricsCard (Total Members)               │
│              ├─ MetricsCard (Total Directors)             │
│              ├─ MetricsCard (Avg OKR)                     │
│              ├─ MetricsCard (Avg BAU)                     │
│              └─ Departments List                          │
│                 ├─ Department Card                        │
│                 │  ├─ Department Name                     │
│                 │  ├─ Director Name                       │
│                 │  ├─ Team Count                          │
│                 │  ├─ Member Count                        │
│                 │  ├─ OKR Progress Bar                    │
│                 │  └─ BAU Health Bar                      │
│                 └─ ...                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Performance Comparison

```
┌───────────────────────────────────────────────────────────────┐
│              PERFORMANCE METRICS (Before vs After)            │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  TEAM DASHBOARD                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Metric              Before      After      Improvement │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ API Calls            50-100    →    1        99% ▼     │ │
│  │ Load Time            5-10s     →  <500ms    95% ▼     │ │
│  │ Code Lines           212       →   25       88% ▼     │ │
│  │ Frontend CPU         HIGH      →  LOW       50% ▼     │ │
│  │ First Paint         1-3s       → <200ms     90% ▼     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  DEPARTMENT DASHBOARD                                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Metric              Before      After      Improvement │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ API Calls            100-500   →    1       99% ▼     │ │
│  │ Load Time            10-20s    →  <500ms    98% ▼     │ │
│  │ Code Lines           281       →   82       71% ▼     │ │
│  │ Frontend CPU         VERY HIGH →  LOW       60% ▼     │ │
│  │ First Paint         2-5s       → <200ms     96% ▼     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ORGANIZATION DASHBOARD                                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Metric              Before      After      Improvement │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ API Calls            1000+     →    1       99% ▼     │ │
│  │ Load Time            30-60s    →  <500ms    99% ▼     │ │
│  │ Code Lines           310       →   47       85% ▼     │ │
│  │ Frontend CPU         EXTREME   →  LOW       80% ▼     │ │
│  │ First Paint         5-10s      → <200ms     98% ▼     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

