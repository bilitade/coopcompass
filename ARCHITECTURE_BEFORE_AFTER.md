# Architecture Comparison: Before vs After

## BEFORE: Frontend Calculations (Problem)

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND ISSUES                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DashboardPage (Team Member)                                    │
│  ├─ calculateOKRProgress() - 20 lines                           │
│  ├─ calculateBAUHealth() - 20 lines                             │
│  ├─ fetchDashboard() - 50+ API calls                            │
│  └─ Render dashboard (150 lines)                                │
│                                                                 │
│  DirectorDashboard                                              │
│  ├─ calculateOKRProgress() - 20 lines [DUPLICATE]               │
│  ├─ calculateBAUHealth() - 20 lines [DUPLICATE]                 │
│  ├─ Loop all teams (multiple API calls)                         │
│  └─ Render dashboard (150 lines)                                │
│                                                                 │
│  ExecutiveDashboard                                             │
│  ├─ calculateOKRProgress() - 20 lines [DUPLICATE]               │
│  ├─ calculateBAUHealth() - 20 lines [DUPLICATE]                 │
│  ├─ Loop all departments and teams (1000s of calls)             │
│  └─ Render dashboard (150 lines)                                │
│                                                                 │
│ PROBLEMS:                                                       │
│ ❌ Code duplication (calculateOKRProgress in 3 places)          │
│ ❌ Inconsistent results (3 different implementations)            │
│ ❌ Performance issues (100s of API calls per page load)          │
│ ❌ Hard to maintain (bug fix in 3 places)                        │
│ ❌ Complex logic in UI layer                                    │
│ ❌ Browser overload with heavy calculations                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## AFTER: Backend Calculations (Solution)

```
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND CENTRALIZATION                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Backend: app/calculations.py                                   │
│  ├─ get_team_dashboard()          [SINGLE SOURCE OF TRUTH]      │
│  │  ├─ calculateOKRProgress()                                   │
│  │  ├─ calculateBAUHealth()                                     │
│  │  └─ Aggregation logic                                        │
│  │                                                              │
│  ├─ get_department_dashboard()    [NEW - Reuses get_team]       │
│  │  ├─ Loop teams (use get_team_dashboard)                     │
│  │  └─ Aggregate metrics                                        │
│  │                                                              │
│  └─ get_organization_dashboard()  [NEW - Reuses departments]    │
│     ├─ Loop departments (use get_department_dashboard)         │
│     └─ Aggregate metrics                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: UNIFIED COMPONENT                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  UnifiedDashboard.tsx (Reusable Component)                      │
│  ├─ variant: "team" | "department" | "organization"             │
│  ├─ Props: teamId, departmentId, onNavigate                     │
│  └─ Render based on variant                                     │
│     ├─ Team layout (OKR, BAU, Weekly priorities)                │
│     ├─ Department layout (Teams overview)                       │
│     └─ Organization layout (Departments overview)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: PAGES (Thin Wrappers)                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DashboardPage → <UnifiedDashboard variant="team" />             │
│  DirectorDashboard → <UnifiedDashboard variant="department" />  │
│  ExecutiveDashboard → <UnifiedDashboard variant="organization" />
│                                                                 │
│ BENEFITS:                                                       │
│ ✅ No code duplication                                          │
│ ✅ Consistent results (1 calculation)                           │
│ ✅ Fast performance (1 API call per page)                       │
│ ✅ Easy to maintain (bug fix in 1 place)                        │
│ ✅ Clean separation of concerns                                 │
│ ✅ Reusable component                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Comparison

### BEFORE: Multiple Paths

```
Team Member                          Director                        Executive
      │                                  │                               │
      ├─ api.getDashboard(teamId)       ├─ api.getDepartments()        ├─ api.getDepartments()
      │  └─ 1 call                      │  └─ 1 call                   │  └─ 1 call
      │                                 │                               │
      ├─ calculateOKRProgress()         ├─ api.getDepartmentTeams()    ├─ for each dept:
      │  (20 lines)                     │  └─ N calls                  │   ├─ api.getDepartmentTeams()
      │                                 │                               │   │  └─ N calls
      ├─ calculateBAUHealth()           ├─ for each team:              │   │
      │  (20 lines)                     │  ├─ api.getTeam()            │   ├─ for each team:
      │                                 │  │ └─ N calls               │   │  ├─ api.getTeam()
      └─ Render                         │  ├─ calculateOKRProgress()  │   │  │ └─ N*M calls
                                        │  │ └─ 20 lines [DUPLICATE] │   │  │
                                        │  ├─ calculateBAUHealth()    │   │  ├─ calculateOKRProgress()
                                        │  │ └─ 20 lines [DUPLICATE] │   │  │ └─ [DUPLICATE]
                                        │  └─ api.getTeamOKRs()       │   │  │
                                        │     api.getTeamBAUActivities└─ api.getTeamOKRs()
                                        │     (multiple calls)            └─ [MILLIONS OF CALLS]
                                        │
                                        └─ Render
```

### AFTER: Single Path

```
Team Member                    Director                      Executive
      │                            │                             │
      ├─ UnifiedDashboard          ├─ UnifiedDashboard          ├─ UnifiedDashboard
      │  variant="team"            │  variant="department"      │  variant="organization"
      │                            │                             │
      └─ api.getDashboard()        └─ api.getDepartmentDash..() └─ api.getOrganizationDash..()
         └─ 1 call                    └─ 1 call                     └─ 1 call
            
Backend: get_team_dashboard()  Backend: get_department_      Backend: get_organization_
├─ calculateOKRProgress()      dashboard()                   dashboard()
├─ calculateBAUHealth()        ├─ Loop departments           ├─ Loop departments
└─ Aggregation                 ├─ get_team_dashboard()       ├─ get_department_dashboard()
                               ├─ Aggregate metrics          ├─ Aggregate metrics
                               └─ CONSISTENT                 └─ CONSISTENT
```

## Metrics Calculation Consistency

### OKR Progress Calculation

```python
# Before: 3 different implementations
# DirectorDashboard.py:
krProgress = sum((current/target)*100) / len(key_results)

# ExecutiveDashboard.py:
krProgress = sum((current/target)*100) / len(key_results)  # [MIGHT BE DIFFERENT]

# DashboardPage.tsx:
const progress = Math.min((current / target) * 100, 100)   # [DIFFERENT!]

# After: 1 implementation
# calculations.py:
def calculate_okr_progress(db, okr_id) -> float:
    key_results = db.query(KeyResult).filter(KeyResult.okr_id == okr_id).all()
    if not key_results:
        return 0.0
    kr_progresses = [calculate_kr_progress(db, kr.id) for kr in key_results]
    avg_progress = sum(kr_progresses) / len(kr_progresses)
    return round(avg_progress, 2)
```

### BAU Health Calculation

```python
# Before: Multiple frontend implementations
# Different logic in 3 places

# After: Single backend calculation
def calculate_bau_health(db, bau_activity_id) -> float:
    metrics = db.query(BAUMetric).filter(
        BAUMetric.bau_activity_id == bau_activity_id
    ).all()
    
    if not metrics:
        return 0.0
    
    weighted_health = 0.0
    total_weight = 0.0
    
    for metric in metrics:
        if metric.is_higher_better:
            achievement = min((float(metric.current_value) / float(metric.target_value)) * 100, 100.0)
        else:
            achievement = min((float(metric.target_value) / float(metric.current_value)) * 100, 100.0)
        
        weighted_health += achievement * float(metric.weight)
        total_weight += float(metric.weight)
    
    return round(weighted_health / total_weight, 2) if total_weight > 0 else 0.0
```

## Aggregation Hierarchy

```
Organization Dashboard
│
├─ Department 1 (Aggregated from teams)
│  ├─ Team 1A (Calculated)
│  ├─ Team 1B (Calculated)
│  └─ Team 1C (Calculated)
│
├─ Department 2 (Aggregated from teams)
│  ├─ Team 2A (Calculated)
│  └─ Team 2B (Calculated)
│
└─ Department 3 (Aggregated from teams)
   └─ Team 3A (Calculated)
```

## Response Examples

### Team Dashboard Response
```json
{
  "team_id": 1,
  "okr_progress": 75.5,
  "bau_health": 82.3,
  "okrs": [
    {
      "okr_id": 1,
      "objective": "Increase user engagement",
      "quarter": "Q1 2026",
      "progress": 75.5,
      "key_results": [
        {
          "kr_id": 1,
          "description": "Reach 10K active users",
          "progress": 80.0,
          "current_value": 8000,
          "target_value": 10000
        }
      ]
    }
  ],
  "bau_activities": [...],
  "current_week_priorities": [...],
  "updated_at": "2026-01-20T10:30:00Z"
}
```

### Department Dashboard Response
```json
{
  "department_id": 1,
  "total_teams": 3,
  "total_members": 12,
  "average_okr_progress": 75.5,
  "average_bau_health": 82.3,
  "teams": [
    {
      "team_id": 1,
      "team_name": "Team A",
      "members_count": 4,
      "okr_progress": 80.0,
      "bau_health": 85.0
    },
    {
      "team_id": 2,
      "team_name": "Team B",
      "members_count": 4,
      "okr_progress": 75.5,
      "bau_health": 82.3
    },
    {
      "team_id": 3,
      "team_name": "Team C",
      "members_count": 4,
      "okr_progress": 71.0,
      "bau_health": 79.6
    }
  ],
  "updated_at": "2026-01-20T10:30:00Z"
}
```

### Organization Dashboard Response
```json
{
  "total_departments": 2,
  "total_teams": 5,
  "total_members": 20,
  "total_directors": 2,
  "average_okr_progress": 75.5,
  "average_bau_health": 82.3,
  "departments": [
    {
      "department_id": 1,
      "department_name": "Engineering",
      "director_name": "John Doe",
      "teams_count": 3,
      "members_count": 12,
      "okr_progress": 77.5,
      "bau_health": 83.5
    },
    {
      "department_id": 2,
      "department_name": "Product",
      "director_name": "Jane Smith",
      "teams_count": 2,
      "members_count": 8,
      "okr_progress": 73.5,
      "bau_health": 81.1
    }
  ],
  "updated_at": "2026-01-20T10:30:00Z"
}
```

