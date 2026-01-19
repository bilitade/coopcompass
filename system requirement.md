# System Requirements: Team Performance & Execution System

## 1. Overview

This document defines the **system requirements** for implementing the Team Performance & Execution System based on the business requirements. The system enables **automated tracking, measurement, and reporting** of team performance across both strategic (OKR) and operational (BAU) activities.

---

## 2. Functional Requirements

### 2.1 User & Team Management

**FR-1.1: Team Management**
- System shall support multiple teams with unique identifiers
- System shall allow creation, editing, and archiving of teams
- Each team shall have a name, description, and creation date

**FR-1.2: User Management**
- System shall support user registration and authentication
- System shall support three user roles: Team Member, Team Lead, Executive
- Users shall be assigned to one team
- Users shall have email-based login with password authentication
- System shall use JWT tokens for session management

**FR-1.3: Role-Based Access Control**
- Team Members can: view team data, update their tasks
- Team Leads can: all member permissions + create/edit OKRs, BAU, work items
- Executives can: view all teams (read-only)

---

### 2.2 OKR Management

**FR-2.1: OKR Creation**
- Team Leads shall create quarterly OKRs with:
  - Quarter designation (Q1 2026, Q2 2026, etc.)
  - Objective statement (qualitative goal)
  - Multiple key results (minimum 1, recommended 3-5)
- System shall validate quarter format and objective text length

**FR-2.2: Key Result Definition**
- Each KR shall have:
  - Description (what to achieve)
  - Target value (numeric)
  - Current value (starts at 0, auto-calculated)
  - Unit of measurement (optional)
- System shall track KR progress over time

**FR-2.3: OKR Editing & Archiving**
- Team Leads can edit OKRs and KRs during the quarter
- System shall maintain history of changes
- Past quarter OKRs can be archived (not deleted)

**FR-2.4: OKR Progress Calculation**
- System shall automatically calculate:
  - Work Item Progress = (Completed Tasks / Total Tasks) × 100
  - KR Progress = Average(Work Item Progress linked to KR)
  - OKR Progress = Average(all KR Progress)
- Calculations shall update in real-time when tasks change

---

### 2.3 BAU Management

**FR-3.1: BAU Activity Creation**
- Team Leads shall create BAU activities with:
  - Name (e.g., "Incident Management")
  - Description (optional)
  - Multiple metrics
- BAU activities persist across quarters

**FR-3.2: BAU Metric Definition**
- Each metric shall have:
  - Name (e.g., "SLA Adherence")
  - Target value (numeric)
  - Current value (updated manually or via API)
  - Unit (%, minutes, count, etc.)
  - Weight (for health calculation)
  - Direction flag (higher is better / lower is better)

**FR-3.3: BAU Metric Updates**
- Team Leads can manually update metric values
- System shall support API integration for automated metric updates
- System shall maintain metric history with timestamps

**FR-3.4: BAU Health Calculation**
- System shall automatically calculate:
  - Metric Achievement = (Current / Target) × 100 (or inverse for "lower is better")
  - Activity Health = Weighted average of metric achievements
  - Team BAU Health = Average of all activity health scores
- Health scores shall be capped at 100%
- Calculations shall update when metrics are updated

---

### 2.4 Work Item Management

**FR-4.1: Work Item Creation (Monthly Heads-Up)**
- Team Leads shall create work items during monthly planning with:
  - Name and description
  - Source type (OKR or BAU)
  - Source ID (link to Key Result or BAU Activity)
  - Owner (team member)
  - Month designation (YYYY-MM format)
- **Primary cadence:** Work items created at start of each month
- **Ad-hoc:** Work items can also be created mid-month as needs arise
- Work items go into "monthly backlog" for weekly prioritization

**FR-4.2: Monthly Heads-Up Interface**
- System shall provide a monthly planning view showing:
  - Current quarter OKRs and progress
  - BAU activities and current health
  - Existing work items for the month
  - Ability to create new work items from OKRs or BAU
- Interface shall allow linking work items to specific KRs or BAU activities
- Interface shall suggest work items based on OKR/BAU that need attention

**FR-4.3: Work Item Types**
- **OKR Work Items**: Linked to Key Results, contribute to KR progress
- **BAU Work Items**: Linked to BAU Activities, support metric improvement
- Both types flow through same weekly planning → task → execution process

**FR-4.4: Work Item Lifecycle**
```
Created (Monthly) → Available for Planning → 
Prioritized (Weekly) → Tasks Created → 
In Progress → Done
```

**FR-4.5: Work Item Status**
- **Not Started**: Work item created but not yet prioritized
- **Planned**: Assigned priority for current/future week
- **In Progress**: Tasks exist and at least one task in progress
- **Done**: All tasks completed (100%)
- System shall automatically determine status based on tasks and priorities

---

### 2.5 Task Management

**FR-5.1: Task Creation**
- Team members or leads shall create tasks with:
  - Description
  - Assignee (team member)
  - Work item link
  - Effort estimate (hours, optional)
  - Status (default: Not Started)
- Tasks break down work items into actionable items

**FR-5.2: Task Status Updates**
- Assignees shall update task status to:
  - Not Started
  - In Progress
  - Done
  - Blocked
- System shall timestamp status changes
- System shall record completion timestamp when marked Done

**FR-5.3: Task Dependencies**
- System shall support task blocking with reason
- Blocked tasks shall be visible in dashboards
- (Advanced dependency tracking out of scope for MVP)

---

### 2.6 Weekly Planning

**FR-6.1: Monthly to Weekly Bridge**
- System shall display all available work items from monthly heads-up
- Team Leads shall select which work items to work on this week
- Not all monthly work items need to be prioritized every week
- Unprioritized items remain available for future weeks

**FR-6.2: Weekly Priority Assignment**
- Team Leads shall assign weekly priorities (P1, P2, P3) to selected work items
- Priorities are specific to a week (e.g., 2026-W02)
- Multiple work items can have the same priority level
- System shall validate reasonable priority distribution (e.g., max 3 P1 items)
- System shall track priority history (if priority changes)

**FR-6.3: Task Breakdown (During Weekly Planning)**
- Once work item is prioritized, Team Lead or team members break it into tasks
- Tasks are created during Monday planning session
- System shall allow bulk task creation
- System shall suggest task breakdown based on work item type

**FR-6.4: Weekly Planning Interface**
- System shall provide a weekly planning view showing:
  - Available work items (from monthly backlog)
  - Currently prioritized items
  - Tasks under each prioritized work item
  - Team capacity and current load
- Interface shall support drag-and-drop or click-to-prioritize
- Interface shall show work item progress from previous weeks (if any)

**FR-6.5: Weekly View Features**
- Filter work items by source (OKR vs BAU)
- Sort by owner, source, or creation date
- Highlight overdue or blocked items
- Show team member assignments and capacity

---

### 2.7 Performance Dashboard

**FR-7.1: Team Dashboard**
- System shall display:
  - OKR progress (overall and by KR)
  - BAU health (overall and by activity)
  - Current week priorities and task status
  - Week-over-week trends
- Dashboard shall update in real-time

**FR-7.2: Progress Visualization**
- OKR progress displayed as percentage with progress bars
- BAU health displayed as percentage with color coding:
  - Green: ≥90%
  - Yellow: 70-89%
  - Red: <70%
- Charts showing trends over time (line charts for weekly progress)

**FR-7.3: Drill-Down Capability**
- Users can click on KRs to see linked work items
- Users can click on work items to see tasks
- Users can click on BAU activities to see individual metrics

---

### 2.8 Reporting

**FR-8.1: Weekly Review Report**
- System shall generate weekly summary showing:
  - OKR progress this week
  - BAU health this week
  - Completed work items
  - Blocked tasks
- Report available every Friday

**FR-8.2: Quarterly Report**
- System shall generate end-of-quarter report showing:
  - Final OKR achievement
  - Average BAU health
  - Total work items completed
  - Team performance trends

**FR-8.3: Export Capability**
- Reports exportable to PDF (stretch goal for MVP)
- Data exportable to CSV

---

## 3. Non-Functional Requirements

### 3.1 Performance

**NFR-1.1: Response Time**
- API responses shall complete in <500ms (95th percentile)
- Dashboard shall load in <2 seconds on standard broadband
- Real-time calculations shall complete in <100ms

**NFR-1.2: Scalability**
- System shall support:
  - MVP: 1-10 teams, 100 users, 1000 tasks
  - Future: 100 teams, 1000 users, 10,000 tasks
- Database queries shall use indexes for optimal performance

**NFR-1.3: Concurrency**
- System shall support 50 concurrent users without degradation
- Database shall handle concurrent updates with proper locking

---

### 3.2 Usability

**NFR-2.1: User Interface**
- UI shall be responsive (desktop, tablet, mobile)
- UI shall follow modern design principles (clean, minimal)
- Navigation shall be intuitive (max 3 clicks to any feature)

**NFR-2.2: Accessibility**
- Color coding shall be supplemented with icons/text
- Interface shall be keyboard-navigable
- Text shall have sufficient contrast for readability

**NFR-2.3: User Experience**
- Task status updates shall require max 2 clicks
- Weekly planning shall be completable in <30 minutes
- Dashboard shall provide at-a-glance performance view

---

### 3.3 Reliability

**NFR-3.1: Availability**
- System shall have 99% uptime during business hours
- Scheduled maintenance shall be communicated 24 hours in advance
- System shall gracefully handle errors with user-friendly messages

**NFR-3.2: Data Integrity**
- All calculations shall be deterministic and repeatable
- Database transactions shall be ACID-compliant
- System shall validate all user inputs

**NFR-3.3: Backup & Recovery**
- Database shall be backed up daily
- System shall be recoverable within 4 hours in case of failure

---

### 3.4 Security

**NFR-4.1: Authentication**
- Passwords shall be hashed using bcrypt or equivalent
- JWT tokens shall expire after 30 minutes
- Failed login attempts shall be rate-limited (5 attempts per 15 min)

**NFR-4.2: Authorization**
- All API endpoints shall validate user permissions
- Users shall only access data for their team (except executives)
- System shall log all access and modifications

**NFR-4.3: Data Protection**
- API shall use HTTPS for all communications
- Sensitive data shall be encrypted at rest
- SQL injection and XSS attacks shall be prevented

---

### 3.5 Maintainability

**NFR-5.1: Code Quality**
- Backend shall follow PEP 8 (Python) style guidelines
- Frontend shall use TypeScript for type safety
- Code shall be documented with comments and docstrings

**NFR-5.2: Testing**
- Unit tests shall cover >80% of business logic
- API endpoints shall have integration tests
- Critical paths shall have end-to-end tests

**NFR-5.3: Logging & Monitoring**
- System shall log errors with stack traces
- API requests shall be logged with response times
- System shall alert on critical errors

---

## 4. System Architecture

### 4.1 Architecture Pattern
- **Pattern**: Three-tier architecture
  - Presentation Layer (Frontend)
  - Business Logic Layer (Backend API)
  - Data Layer (Database)

### 4.2 Technology Stack

**Backend:**
- Framework: FastAPI (Python 3.11+)
- Database: PostgreSQL 15
- ORM: SQLAlchemy 2.0
- Authentication: JWT (PyJWT)
- Validation: Pydantic v2

**Frontend:**
- Framework: React 18 + TypeScript
- Build Tool: Vite
- UI Library: Tailwind CSS + shadcn/ui
- State Management: React Query (TanStack Query)
- HTTP Client: Axios

**Deployment:**
- Backend: Railway / Render
- Frontend: Vercel / Netlify
- Database: Railway PostgreSQL

---

## 5. Data Model

### 5.1 Core Tables

```sql
-- Teams
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- OKRs
CREATE TABLE okrs (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id),
    quarter VARCHAR(10) NOT NULL,
    objective TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE key_results (
    id SERIAL PRIMARY KEY,
    okr_id INT REFERENCES okrs(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- BAU
CREATE TABLE bau_activities (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bau_metrics (
    id SERIAL PRIMARY KEY,
    bau_activity_id INT REFERENCES bau_activities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(50),
    weight DECIMAL(3,2) DEFAULT 1.0,
    is_higher_better BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Work Items
CREATE TABLE work_items (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id),
    name TEXT NOT NULL,
    description TEXT,
    source_type VARCHAR(10) NOT NULL,
    source_id INT NOT NULL,
    owner_id INT REFERENCES users(id),
    month VARCHAR(7) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Weekly Priorities
CREATE TABLE weekly_priorities (
    id SERIAL PRIMARY KEY,
    work_item_id INT REFERENCES work_items(id) ON DELETE CASCADE,
    week VARCHAR(8) NOT NULL,
    priority INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(work_item_id, week)
);

-- Tasks
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    work_item_id INT REFERENCES work_items(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    assignee_id INT REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'Not Started',
    effort_hours INT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Metric History
CREATE TABLE metric_history (
    id SERIAL PRIMARY KEY,
    bau_metric_id INT REFERENCES bau_metrics(id) ON DELETE CASCADE,
    value DECIMAL(10,2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT NOW()
);
```

### 5.2 Indexes

```sql
CREATE INDEX idx_users_team ON users(team_id);
CREATE INDEX idx_okrs_team_quarter ON okrs(team_id, quarter);
CREATE INDEX idx_work_items_source ON work_items(source_type, source_id);
CREATE INDEX idx_work_items_month ON work_items(month);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_weekly_priorities_week ON weekly_priorities(week);
```

---

## 6. API Specifications

### 6.1 Authentication Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout
```

### 6.2 Team & User Endpoints

```
GET    /api/teams
POST   /api/teams
GET    /api/teams/{id}
GET    /api/teams/{id}/users
POST   /api/teams/{id}/users
```

### 6.3 OKR Endpoints

```
POST   /api/teams/{id}/okrs
GET    /api/teams/{id}/okrs?quarter=Q1%202026
GET    /api/okrs/{id}
PUT    /api/okrs/{id}
POST   /api/okrs/{id}/key-results
PUT    /api/key-results/{id}
GET    /api/key-results/{id}/progress
```

### 6.4 BAU Endpoints

```
POST   /api/teams/{id}/bau-activities
GET    /api/teams/{id}/bau-activities
GET    /api/bau-activities/{id}
POST   /api/bau-activities/{id}/metrics
PATCH  /api/bau-metrics/{id}
GET    /api/bau-activities/{id}/health
```

### 6.5 Work Item & Task Endpoints

```
POST   /api/work-items
GET    /api/work-items?month=2026-01&team_id=1
GET    /api/work-items/{id}
POST   /api/work-items/{id}/tasks
PATCH  /api/tasks/{id}
GET    /api/tasks/{id}
```

### 6.6 Planning Endpoints

```
POST   /api/weekly-priorities
GET    /api/weekly-priorities?week=2026-W02&team_id=1
PUT    /api/weekly-priorities/{id}
```

### 6.7 Dashboard Endpoints

```
GET    /api/teams/{id}/dashboard
GET    /api/teams/{id}/performance?start_week=2026-W01&end_week=2026-W04
```

---

## 7. Calculation Specifications

### 7.1 Work Item Progress

```python
def calculate_work_item_progress(work_item_id: int) -> float:
    tasks = get_tasks(work_item_id)
    if not tasks:
        return 0.0
    done_count = sum(1 for t in tasks if t.status == "Done")
    return (done_count / len(tasks)) * 100
```

### 7.2 Key Result Progress

```python
def calculate_kr_progress(kr_id: int) -> float:
    work_items = get_work_items(source_type="OKR", source_id=kr_id)
    if not work_items:
        return 0.0
    progress_sum = sum(calculate_work_item_progress(wi.id) for wi in work_items)
    return progress_sum / len(work_items)
```

### 7.3 OKR Progress

```python
def calculate_okr_progress(okr_id: int) -> float:
    key_results = get_key_results(okr_id)
    if not key_results:
        return 0.0
    kr_progress_sum = sum(calculate_kr_progress(kr.id) for kr in key_results)
    return kr_progress_sum / len(key_results)
```

### 7.4 BAU Health

```python
def calculate_bau_health(bau_activity_id: int) -> float:
    metrics = get_metrics(bau_activity_id)
    if not metrics:
        return 0.0
    
    weighted_health = 0.0
    total_weight = 0.0
    
    for metric in metrics:
        if metric.is_higher_better:
            achievement = (metric.current_value / metric.target_value) * 100
        else:
            achievement = (metric.target_value / metric.current_value) * 100
        
        achievement = min(achievement, 100)
        weighted_health += achievement * metric.weight
        total_weight += metric.weight
    
    return weighted_health / total_weight if total_weight > 0 else 0.0
```

---

## 8. User Interface Requirements

### 8.1 Page Structure

**Required Pages:**
1. Login
2. Dashboard (main view)
3. OKR Management
4. BAU Management
5. Monthly Planning
6. Weekly Planning
7. Team Performance

### 8.2 Navigation

```
Top Nav:
- Dashboard
- OKRs
- BAU
- Planning (dropdown: Monthly, Weekly)
- Performance
- Profile (dropdown: Settings, Logout)
```

### 8.3 Responsive Design

- Desktop: Full layout with sidebars
- Tablet: Collapsible sidebars
- Mobile: Hamburger menu, stacked cards

---

## 9. Integration Requirements

### 9.1 External System Integration (Future)

**Incident Management Systems:**
- ServiceNow API for incident data
- Jira API for ticket data
- PagerDuty API for incident metrics

**Monitoring Systems:**
- Datadog API for uptime/error metrics
- New Relic API for performance metrics

**Communication:**
- Slack notifications for blockers/alerts

---

## 10. Testing Requirements

### 10.1 Unit Testing
- All calculation functions
- All API endpoints (mocked DB)
- All validation logic

### 10.2 Integration Testing
- Full API flow tests
- Database transaction tests
- Authentication flow tests

### 10.3 User Acceptance Testing
- CEO can view dashboard
- Team Lead can complete weekly planning
- Team Member can update tasks

---

## 11. Deployment Requirements

### 11.1 Environment Variables

**Backend:**
```
DATABASE_URL
SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS
```

**Frontend:**
```
VITE_API_URL
```

### 11.2 Database Migrations
- Use Alembic for schema migrations
- All schema changes versioned
- Rollback capability required

### 11.3 CI/CD
- Automated testing on commit
- Automated deployment on merge to main
- Health checks post-deployment

---

## 12. Success Criteria

**The system meets requirements when:**

1. ✅ Team Lead can set up OKRs and BAU in <15 minutes
2. ✅ Weekly planning takes <30 minutes
3. ✅ Dashboard loads in <2 seconds
4. ✅ Task updates take <30 seconds
5. ✅ Calculations are accurate (validated manually)
6. ✅ System supports 10 teams with 100 users
7. ✅ 95% uptime achieved in production

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-19 | System Architect | Initial version |

---

**End of System Requirements Document**