# Implementation Plan: Team Performance & Execution System

## Executive Summary

**Project Name:** Team Performance & Execution System (Compass)  
**Purpose:** Unified system for tracking strategic goals (OKRs) and operational health (BAU)  
**Timeline:** 6 weeks for MVP  
**Deployment:** Fully functional production system (not a prototype)  
**Demo Date:** Week 6 to CEO

---

## 1. Project Overview

### 1.1 What We're Building

A web-based system that enables banking teams to:
- Set quarterly OKRs and BAU metrics
- Plan monthly work items
- Execute weekly priorities
- Track daily task progress
- Measure performance automatically

### 1.2 Key Deliverables

1. **Backend API** (FastAPI + PostgreSQL)
2. **Frontend Web App** (React + TypeScript)
3. **Automated Calculations** (Progress & Health)
4. **Performance Dashboard** (Real-time visibility)
5. **Deployment** (Production-ready on cloud)

---

## 2. Technology Stack

### 2.1 Backend Stack

```yaml
Language:        Python 3.11+
Framework:       FastAPI 0.104+
Database:        PostgreSQL 15
ORM:            SQLAlchemy 2.0
Migrations:      Alembic
Authentication:  JWT (PyJWT)
Validation:      Pydantic v2
API Docs:        OpenAPI/Swagger (auto-generated)
Testing:         pytest
```

**Why FastAPI?**
- Modern, fast, async-capable
- Auto-generated API documentation
- Built-in validation with Pydantic
- Excellent for rapid development

### 2.2 Frontend Stack

```yaml
Language:       TypeScript 5.0+
Framework:      React 18
Build Tool:     Vite 5
UI Library:     Tailwind CSS 
State Mgmt:     React Context API
Routing:        React Router v6
Charts:         Recharts
HTTP Client:    Axios
Forms:          React Hook Form
Icons:          Lucide React
```





## 3. Critical Flow Understanding

### 3.1 The Three-Tier Execution Model

```
TIER 1: MONTHLY HEADS-UP (Strategic Planning)
────────────────────────────────────────────
├─ When: Start of each month (1st-3rd)
├─ Who: Team Lead + key members
├─ Duration: 1-2 hours
├─ Input: Quarterly OKRs + BAU activities
├─ Output: 5-10 work items for the month
└─ Purpose: Bridge quarterly goals to monthly execution

        ↓ Work items created

TIER 2: WEEKLY PLANNING (Tactical Prioritization)
──────────────────────────────────────────────────
├─ When: Every Monday morning
├─ Who: Entire team
├─ Duration: 30-60 minutes
├─ Input: Available work items from monthly backlog
├─ Output: Prioritized items + tasks for the week
└─ Purpose: Focus team on THIS week's work

        ↓ Tasks created and assigned

TIER 3: DAILY EXECUTION (Tactical Execution)
─────────────────────────────────────────────
├─ When: Monday-Friday
├─ Who: Individual contributors
├─ Input: Assigned tasks
├─ Output: Task status updates
└─ Purpose: Get work done

        ↓ Progress tracked

TIER 4: WEEKLY MEASUREMENT (Performance Review)
────────────────────────────────────────────────
├─ When: Friday afternoon
├─ Who: Team Lead + team
├─ Duration: 30 minutes
├─ Input: Task completion data + BAU metrics
├─ Output: Progress report + insights
└─ Purpose: Measure and learn
```

### 3.2 Critical Design Point

**Work Items are NOT created weekly**  
Work items are created **monthly** and then **prioritized** weekly.

**Flow:**
1. Month starts → Create 5-10 work items (monthly heads-up)
2. Week 1 Monday → Prioritize 2-3 work items from backlog
3. Week 1 Monday → Break prioritized items into tasks
4. Week 1 Mon-Fri → Execute tasks
5. Week 2 Monday → Prioritize different 2-3 work items
6. Repeat...

**Example:**
```
January 2026 Monthly Heads-Up (Jan 1):
Created work items:
1. Migrate auth service
2. Migrate payment service
3. Implement auto-failover
4. Research API vendors
5. Deploy security patches
6. Update runbooks

Week 1 Planning (Jan 8):
Prioritized: #1, #5
Created tasks for #1 and #5

Week 2 Planning (Jan 15):
Prioritized: #2, #6
Created tasks for #2 and #6

Week 3 Planning (Jan 22):
Prioritized: #3, #4
Created tasks for #3 and #4

Not all work items worked on every week!
```

```
/tpes-system
│
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI application entry
│   │   ├── database.py                # Database connection & session
│   │   ├── models.py                  # SQLAlchemy models
│   │   ├── schemas.py                 # Pydantic request/response schemas
│   │   ├── auth.py                    # JWT auth utilities
│   │   ├── calculations.py            # Progress & health calculations
│   │   │
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py               # Authentication endpoints
│   │   │   ├── teams.py              # Team management
│   │   │   ├── users.py              # User management
│   │   │   ├── okrs.py               # OKR CRUD
│   │   │   ├── bau.py                # BAU CRUD
│   │   │   ├── work_items.py         # Work item management
│   │   │   ├── tasks.py              # Task management
│   │   │   ├── planning.py           # Weekly planning
│   │   │   └── dashboard.py          # Performance metrics API
│   │   │
│   │   └── utils/
│   │       ├── dependencies.py       # FastAPI dependencies
│   │       └── helpers.py            # Utility functions
│   │
│   ├── alembic/                       # Database migrations
│   ├── tests/                         # Unit & integration tests
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx                   # App entry point
│   │   ├── App.tsx                    # Root component
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.tsx             # Login page
│   │   │   ├── Dashboard.tsx         # Main dashboard
│   │   │   ├── OKRManagement.tsx     # Setup OKRs
│   │   │   ├── BAUManagement.tsx     # Setup BAU
│   │   │   ├── MonthlyPlanning.tsx   # Create work items
│   │   │   ├── WeeklyPlanning.tsx    # Set priorities
│   │   │   └── TeamPerformance.tsx   # Performance view
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── Layout.tsx            # App layout wrapper
│   │   │   ├── Navbar.tsx            # Navigation
│   │   │   ├── OKRCard.tsx           # OKR display card
│   │   │   ├── BAUCard.tsx           # BAU display card
│   │   │   ├── WorkItemCard.tsx      # Work item card
│   │   │   ├── TaskList.tsx          # Task list component
│   │   │   ├── ProgressChart.tsx     # Progress visualization
│   │   │   └── HealthScoreCard.tsx   # Health score display
│   │   │
│   │   ├── services/
│   │   │   └── api.ts                # Axios API client
│   │   │
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript type definitions
│   │   │
│   │   ├── hooks/
│   │   │   └── useAuth.ts            # Authentication hook
│   │   │
│   │   └── lib/
│   │       └── utils.ts              # Utility functions
│   │
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── README.md
│
├── docs/
│   ├── API.md                         # API documentation
│   ├── DEPLOYMENT.md                  # Deployment guide
│   └── USER_GUIDE.md                  # End-user guide
│
├── .gitignore
└── README.md
```

---

## 4. Database Schema

### 4.1 Complete Schema

```sql
-- Teams Table
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('member', 'lead', 'executive')),
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- OKRs Table
CREATE TABLE okrs (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id) ON DELETE CASCADE,
    quarter VARCHAR(10) NOT NULL,
    objective TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(team_id, quarter)
);

-- Key Results Table
CREATE TABLE key_results (
    id SERIAL PRIMARY KEY,
    okr_id INT REFERENCES okrs(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- BAU Activities Table
CREATE TABLE bau_activities (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- BAU Metrics Table
CREATE TABLE bau_metrics (
    id SERIAL PRIMARY KEY,
    bau_activity_id INT REFERENCES bau_activities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(50),
    weight DECIMAL(3,2) DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1),
    is_higher_better BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Work Items Table
CREATE TABLE work_items (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    source_type VARCHAR(10) NOT NULL CHECK (source_type IN ('OKR', 'BAU')),
    source_id INT NOT NULL,
    owner_id INT REFERENCES users(id) ON DELETE SET NULL,
    month VARCHAR(7) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Weekly Priorities Table
CREATE TABLE weekly_priorities (
    id SERIAL PRIMARY KEY,
    work_item_id INT REFERENCES work_items(id) ON DELETE CASCADE,
    week VARCHAR(8) NOT NULL,
    priority INT NOT NULL CHECK (priority IN (1, 2, 3)),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(work_item_id, week)
);

-- Tasks Table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    work_item_id INT REFERENCES work_items(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    assignee_id INT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'Not Started' 
        CHECK (status IN ('Not Started', 'In Progress', 'Done', 'Blocked')),
    effort_hours INT CHECK (effort_hours > 0),
    blocked_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Metric History Table
CREATE TABLE metric_history (
    id SERIAL PRIMARY KEY,
    bau_metric_id INT REFERENCES bau_metrics(id) ON DELETE CASCADE,
    value DECIMAL(10,2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_users_team ON users(team_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_okrs_team_quarter ON okrs(team_id, quarter);
CREATE INDEX idx_key_results_okr ON key_results(okr_id);
CREATE INDEX idx_bau_activities_team ON bau_activities(team_id);
CREATE INDEX idx_bau_metrics_activity ON bau_metrics(bau_activity_id);
CREATE INDEX idx_work_items_source ON work_items(source_type, source_id);
CREATE INDEX idx_work_items_month ON work_items(month);
CREATE INDEX idx_work_items_owner ON work_items(owner_id);
CREATE INDEX idx_tasks_work_item ON tasks(work_item_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_weekly_priorities_week ON weekly_priorities(week);
CREATE INDEX idx_metric_history_metric ON metric_history(bau_metric_id);
CREATE INDEX idx_metric_history_recorded ON metric_history(recorded_at);
```

### 4.2 Entity Relationships

```
teams (1) ──────────── (*) users
  │                         │
  │                         └─ assignee_id, owner_id
  │
  ├─ (1) ───────── (*) okrs
  │                      │
  │                      └─ (1) ──── (*) key_results
  │                                       │
  │                                       └─ source_id (for work_items)
  │
  └─ (1) ───────── (*) bau_activities
                         │
                         ├─ (1) ──── (*) bau_metrics
                         │                 │
                         │                 └─ (1) ──── (*) metric_history
                         │
                         └─ source_id (for work_items)

work_items (*) ──────── (1) weekly_priorities
    │
    └─ (1) ──────────── (*) tasks
```

---

## 5. Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Week 1: Backend Setup**

**Day 1-2: Project Setup**
- [ ] Initialize Git repository
- [ ] Setup backend Python virtual environment
- [ ] Install FastAPI, SQLAlchemy, dependencies
- [ ] Create database schema with Alembic
- [ ] Setup PostgreSQL locally

**Day 3-4: Core Models & Auth**
- [ ] Implement SQLAlchemy models (all tables)
- [ ] Create Pydantic schemas
- [ ] Implement JWT authentication
- [ ] Create auth endpoints (login, register, me)
- [ ] Test authentication flow

**Day 5: Teams & Users API**
- [ ] Implement team CRUD endpoints
- [ ] Implement user management endpoints
- [ ] Add role-based access control
- [ ] Write unit tests
- [ ] Test with Postman/Swagger

**Week 2: OKR & BAU Backend**

**Day 1-2: OKR API**
- [ ] Implement OKR CRUD endpoints
- [ ] Implement Key Result endpoints
- [ ] Add validation logic
- [ ] Write unit tests
- [ ] Test OKR creation flow

**Day 3-4: BAU API**
- [ ] Implement BAU Activity endpoints
- [ ] Implement BAU Metric endpoints
- [ ] Add metric update functionality
- [ ] Implement metric history tracking
- [ ] Write unit tests

**Day 5: Calculations**
- [ ] Implement work item progress calculation
- [ ] Implement KR progress calculation
- [ ] Implement OKR progress calculation
- [ ] Implement BAU health calculation
- [ ] Test all calculation logic

**Deliverable:** Backend API with auth, OKR, and BAU management

---

### Phase 2: Execution Layer (Week 3-4)

**Week 3: Work Items & Tasks**

**Day 1-2: Work Items API**
- [ ] Implement work item CRUD endpoints
- [ ] Add work item filtering (by month, team, source)
- [ ] Link work items to OKRs and BAU
- [ ] Write unit tests
- [ ] Test work item creation from OKRs/BAU

**Day 3-4: Tasks API**
- [ ] Implement task CRUD endpoints
- [ ] Add task status update functionality
- [ ] Implement task assignment logic
- [ ] Add blocked task handling
- [ ] Write unit tests

**Day 5: Weekly Planning API**
- [ ] Implement weekly priorities endpoints
- [ ] Add priority assignment logic
- [ ] Create weekly view aggregation
- [ ] Test weekly planning flow
- [ ] Write unit tests

**Week 4: Frontend Foundation**

**Day 1-2: Frontend Setup**
- [ ] Initialize React + Vite project
- [ ] Setup Tailwind CSS + shadcn/ui
- [ ] Create routing structure
- [ ] Implement authentication context
- [ ] Create login page

**Day 3-4: Core Components**
- [ ] Create Layout component with navbar
- [ ] Create reusable UI components (cards, buttons)
- [ ] Implement API service with Axios
- [ ] Setup React Query
- [ ] Connect login to backend

**Day 5: OKR & BAU UI**
- [ ] Create OKR Management page
- [ ] Create BAU Management page
- [ ] Implement OKR creation form
- [ ] Implement BAU creation form
- [ ] Test CRUD operations

**Deliverable:** Full execution layer (backend + basic frontend)

---

### Phase 3: Dashboard & Measurement (Week 5-6)

**Week 5: Dashboard Implementation**

**Day 1-2: Dashboard API**
- [ ] Create dashboard aggregation endpoint
- [ ] Implement performance metrics endpoint
- [ ] Add trending data endpoints
- [ ] Optimize queries with joins
- [ ] Test dashboard performance

**Day 3-4: Dashboard UI**
- [ ] Create Dashboard page
- [ ] Implement OKR progress display
- [ ] Implement BAU health cards
- [ ] Add progress charts (Recharts)
- [ ] Add weekly priorities view

**Day 5: Planning Pages**
- [ ] Create Monthly Planning page
- [ ] Create Weekly Planning page
- [ ] Implement work item creation flow
- [ ] Implement task breakdown interface
- [ ] Test planning workflows

**Week 6: Polish & Deployment**

**Day 1-2: Performance View**
- [ ] Create Team Performance page
- [ ] Add detailed KR view
- [ ] Add detailed BAU metric view
- [ ] Implement drill-down functionality
- [ ] Add export capabilities (CSV)

**Day 3: Testing & Bug Fixes**
- [ ] End-to-end testing
- [ ] Fix critical bugs
- [ ] Performance optimization
- [ ] Security audit
- [ ] User acceptance testing

**Day 4: Deployment**
- [ ] Deploy backend to Railway
- [ ] Deploy frontend to Vercel
- [ ] Configure environment variables
- [ ] Setup database on Railway
- [ ] Test production deployment

**Day 5: Demo Preparation**
- [ ] Seed demo data
- [ ] Prepare CEO demo script
- [ ] Create user guide
- [ ] Final testing
- [ ] CEO Demo 🎉

**Deliverable:** Production-ready MVP with CEO demo

---

## 6. Key API Endpoints

### 6.1 Authentication
```
POST   /api/auth/register              Register new user
POST   /api/auth/login                 Login (returns JWT)
GET    /api/auth/me                    Get current user
POST   /api/auth/logout                Logout
```

### 6.2 Teams & Users
```
GET    /api/teams                      List all teams
POST   /api/teams                      Create team
GET    /api/teams/{id}                 Get team details
GET    /api/teams/{id}/users           List team users
POST   /api/teams/{id}/users           Add user to team
```

### 6.3 OKRs
```
POST   /api/teams/{id}/okrs            Create OKR
GET    /api/teams/{id}/okrs            List team OKRs (filter by quarter)
GET    /api/okrs/{id}                  Get OKR details
PUT    /api/okrs/{id}                  Update OKR
DELETE /api/okrs/{id}                  Archive OKR
POST   /api/okrs/{id}/key-results      Add Key Result
PUT    /api/key-results/{id}           Update Key Result
GET    /api/key-results/{id}/progress  Get KR progress
```

### 6.4 BAU
```
POST   /api/teams/{id}/bau             Create BAU activity
GET    /api/teams/{id}/bau             List BAU activities
GET    /api/bau/{id}                   Get BAU details
POST   /api/bau/{id}/metrics           Add metric
PATCH  /api/bau-metrics/{id}           Update metric value
GET    /api/bau/{id}/health            Get BAU health score
GET    /api/bau-metrics/{id}/history   Get metric history
```

### 6.5 Work Items & Tasks
```
POST   /api/work-items                 Create work item
GET    /api/work-items                 List work items (filter: month, team)
GET    /api/work-items/{id}            Get work item details
PUT    /api/work-items/{id}            Update work item
POST   /api/work-items/{id}/tasks      Create task
GET    /api/tasks/{id}                 Get task details
PATCH  /api/tasks/{id}                 Update task (status, etc.)
GET    /api/users/{id}/tasks           Get user's tasks
```

### 6.6 Planning
```
POST   /api/weekly-priorities          Set weekly priority
GET    /api/weekly-priorities          Get priorities (filter: week, team)
PUT    /api/weekly-priorities/{id}     Update priority
DELETE /api/weekly-priorities/{id}     Remove priority
```

### 6.7 Dashboard
```
GET    /api/teams/{id}/dashboard       Get team dashboard data
GET    /api/teams/{id}/performance     Get performance over time
GET    /api/okrs/{id}/progress         Get OKR progress
```

---

## 7. Core Calculation Implementations

### 7.1 Work Item Progress

```python
# calculations.py
from sqlalchemy.orm import Session
from app import models

def calculate_work_item_progress(db: Session, work_item_id: int) -> float:
    """Calculate progress based on task completion."""
    tasks = db.query(models.Task).filter(
        models.Task.work_item_id == work_item_id
    ).all()
    
    if not tasks:
        return 0.0
    
    done_count = sum(1 for task in tasks if task.status == "Done")
    return round((done_count / len(tasks)) * 100, 2)
```

### 7.2 Key Result Progress

```python
def calculate_kr_progress(db: Session, kr_id: int) -> float:
    """Calculate KR progress from related work items."""
    work_items = db.query(models.WorkItem).filter(
        models.WorkItem.source_type == "OKR",
        models.WorkItem.source_id == kr_id
    ).all()
    
    if not work_items:
        return 0.0
    
    total_progress = sum(
        calculate_work_item_progress(db, wi.id) for wi in work_items
    )
    
    avg_progress = total_progress / len(work_items)
    
    # Update KR current_value
    kr = db.query(models.KeyResult).filter(models.KeyResult.id == kr_id).first()
    if kr:
        kr.current_value = (avg_progress / 100) * kr.target_value
        db.commit()
    
    return round(avg_progress, 2)
```

### 7.3 OKR Progress

```python
def calculate_okr_progress(db: Session, okr_id: int) -> float:
    """Calculate overall OKR progress."""
    key_results = db.query(models.KeyResult).filter(
        models.KeyResult.okr_id == okr_id
    ).all()
    
    if not key_results:
        return 0.0
    
    kr_progresses = [calculate_kr_progress(db, kr.id) for kr in key_results]
    return round(sum(kr_progresses) / len(kr_progresses), 2)
```

### 7.4 BAU Health Score

```python
def calculate_bau_health(db: Session, bau_activity_id: int) -> float:
    """Calculate BAU health from metrics."""
    metrics = db.query(models.BAUMetric).filter(
        models.BAUMetric.bau_activity_id == bau_activity_id
    ).all()
    
    if not metrics:
        return 0.0
    
    weighted_health = 0.0
    total_weight = 0.0
    
    for metric in metrics:
        # Calculate achievement percentage
        if metric.current_value == 0:
            achievement = 0.0
        elif metric.is_higher_better:
            achievement = (metric.current_value / metric.target_value) * 100
        else:
            achievement = (metric.target_value / metric.current_value) * 100
        
        # Cap at 100%
        achievement = min(achievement, 100.0)
        
        weighted_health += achievement * metric.weight
        total_weight += metric.weight
    
    if total_weight == 0:
        return 0.0
    
    return round(weighted_health / total_weight, 2)
```

### 7.5 Team Dashboard Data

```python
def get_team_dashboard(db: Session, team_id: int) -> dict:
    """Get complete dashboard data for a team."""
    # Get current quarter OKR
    from datetime import datetime
    current_quarter = f"Q{(datetime.now().month - 1) // 3 + 1} {datetime.now().year}"
    
    okr = db.query(models.OKR).filter(
        models.OKR.team_id == team_id,
        models.OKR.quarter == current_quarter
    ).first()
    
    okr_progress = calculate_okr_progress(db, okr.id) if okr else 0.0
    
    # Get BAU activities
    bau_activities = db.query(models.BAUActivity).filter(
        models.BAUActivity.team_id == team_id,
        models.BAUActivity.is_active == True
    ).all()
    
    bau_healths = [
        {
            "activity_id": activity.id,
            "activity_name": activity.name,
            "health": calculate_bau_health(db, activity.id)
        }
        for activity in bau_activities
    ]
    
    avg_bau_health = (
        sum(b["health"] for b in bau_healths) / len(bau_healths)
        if bau_healths else 0.0
    )
    
    # Get current week priorities
    from datetime import date
    current_week = date.today().strftime("%Y-W%U")
    
    priorities = db.query(models.WeeklyPriority).filter(
        models.WeeklyPriority.week == current_week
    ).join(models.WorkItem).filter(
        models.WorkItem.team_id == team_id
    ).all()
    
    return {
        "okr_progress": okr_progress,
        "bau_health": round(avg_bau_health, 2),
        "bau_activities": bau_healths,
        "current_week_priorities": [
            {
                "work_item_id": p.work_item_id,
                "priority": p.priority,
                "progress": calculate_work_item_progress(db, p.work_item_id)
            }
            for p in priorities
        ]
    }
```

---

## 8. Development Setup

### 8.1 Backend Setup

```bash
# Clone repository
git clone <repo-url>
cd tpes-system/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and SECRET_KEY

# Initialize database
alembic upgrade head

# Run development server
uvicorn app.main:app --reload --port 8000
```

**requirements.txt:**
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.12.1
pydantic==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pytest==7.4.3
httpx==0.25.2
```

### 8.2 Frontend Setup

```bash
cd tpes-system/frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with VITE_API_URL

# Run development server
npm run dev
```

**package.json (key dependencies):**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "typescript": "^5.3.0",
    "@tanstack/react-query": "^5.12.0",
    "axios": "^1.6.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "react-hook-form": "^7.48.0",
    "tailwindcss": "^3.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}
```

---

## 9. Deployment Guide

### 9.1 Backend Deployment (Railway)

**Step 1: Prepare for Deployment**
```bash
# Create Procfile (if needed)
echo "web: uvicorn app.main:app --host 0.0.0.0 --port \$PORT" > Procfile

# Ensure requirements.txt is up to date
pip freeze > requirements.txt
```

**Step 2: Deploy to Railway**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to PostgreSQL
railway add postgresql

# Set environment variables
railway variables set SECRET_KEY="your-secret-key"
railway variables set ALGORITHM="HS256"

# Deploy
railway up
```

**Step 3: Run Migrations**
```bash
railway run alembic upgrade head
```

### 9.2 Frontend Deployment (Vercel)

**Step 1: Prepare for Deployment**
```bash
# Build test
npm run build

# Create vercel.json (if needed)
cat > vercel.json << EOF
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
EOF
```

**Step 2: Deploy to Vercel**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variable
vercel env add VITE_API_URL production
# Enter your Railway backend URL
```

### 9.3 Post-Deployment

**Verify Deployment:**
- [ ] Backend health check: `https://your-backend.railway.app/docs`
- [ ] Frontend loads: `https://your-frontend.vercel.app`
- [ ] Login functionality works
- [ ] API calls successful
- [ ] Database connected

---

## 10. Testing Strategy

### 10.1 Unit Tests

```python
# tests/test_calculations.py
def test_work_item_progress():
    # Mock database with 5 tasks (3 done, 2 pending)
    progress = calculate_work_item_progress(db, work_item_id=1)
    assert progress == 60.0

def test_bau_health():
    # Mock BAU with 2 metrics
    health = calculate_bau_health(db, bau_activity_id=1)
    assert 0 <= health <= 100
```

### 10.2 Integration Tests

```python
# tests/test_api.py
def test_create_okr_flow(client, auth_headers):
    # Create OKR
    response = client.post(
        "/api/teams/1/okrs",
        json={
            "quarter": "Q1 2026",
            "objective": "Modernize Core Banking"
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    okr_id = response.json()["id"]
    
    # Add Key Result
    response = client.post(
        f"/api/okrs/{okr_id}/key-results",
        json={
            "description": "Migrate 5 services",
            "target_value": 5,
            "unit": "services"
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    
    # Verify progress calculation
    response = client.get(f"/api/okrs/{okr_id}/progress", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["progress"] == 0.0
```

### 10.3 End-to-End Tests

**Manual Test Scenarios:**

1. **Complete Planning Flow**
   - Login as Team Lead
   - Create OKR with 3 KRs
   - Create BAU activity with 2 metrics
   - Create 3 work items (2 from OKR, 1 from BAU)
   - Set weekly priorities
   - Break work items into tasks
   - Update task statuses
   - Verify dashboard shows correct progress

2. **Performance Measurement Flow**
   - Complete 2/5 tasks in work item
   - Verify work item shows 40% progress
   - Verify KR progress updates
   - Update BAU metrics
   - Verify BAU health calculates correctly
   - Check dashboard displays accurate data

---

## 11. Demo Script for CEO

### 11.1 Demo Preparation

**Setup Demo Data:**
```python
# seed_demo_data.py
def seed_demo_data():
    # Create team
    team = Team(name="Engineering Team")
    
    # Create users
    lead = User(name="Sarah Chen", email="sarah@bank.com", role="lead", team=team)
    member1 = User(name="John Smith", email="john@bank.com", role="member", team=team)
    member2 = User(name="Mike Johnson", email="mike@bank.com", role="member", team=team)
    
    # Create OKR
    okr = OKR(
        team=team,
        quarter="Q1 2026",
        objective="Modernize Core Banking Infrastructure"
    )
    
    # Create Key Results
    kr1 = KeyResult(okr=okr, description="Migrate 5 services to cloud", target_value=5)
    kr2 = KeyResult(okr=okr, description="Reduce downtime by 50%", target_value=2)
    kr3 = KeyResult(okr=okr, description="Deploy new API gateway", target_value=100)
    
    # Create BAU Activities
    bau1 = BAUActivity(team=team, name="Incident Management")
    metric1 = BAUMetric(
        bau_activity=bau1,
        name="SLA Adherence",
        target_value=95,
        current_value=93,
        weight=0.5
    )
    metric2 = BAUMetric(
        bau_activity=bau1,
        name="MTTR",
        target_value=30,
        current_value=35,
        weight=0.5,
        is_higher_better=False
    )
    
    # Create Work Items (partially complete)
    wi1 = WorkItem(
        team=team,
        name="Migrate authentication service",
        source_type="OKR",
        source_id=kr1.id,
        owner=lead,
        month="2026-01"
    )
    
    # Create Tasks (some completed)
    Task(work_item=wi1, description="Setup AWS", assignee=member1, status="Done")
    Task(work_item=wi1, description="Configure DB", assignee=lead, status="Done")
    Task(work_item=wi1, description="Migrate data", assignee=member2, status="In Progress")
    Task(work_item=wi1, description="Update APIs", assignee=lead, status="Not Started")
    Task(work_item=wi1, description="Run tests", assignee=member1, status="Not Started")
    
    db.session.commit()
```

### 11.2 10-Minute Demo Flow

**[0:00 - 1:00] Introduction**
```
"Good morning. I'm excited to show you our new Team Performance & Execution System. 

This system solves a key problem: how do we track both strategic goals and 
operational health in one place?

Let me walk you through a typical quarter for the Engineering Team."
```

**[1:00 - 3:00] Quarterly Setup**
```
"At the start of Q1, Sarah (the Team Lead) sets up their strategic goals.

[Show OKR Management page]

Here's their objective: 'Modernize Core Banking Infrastructure'

With three key results:
1. Migrate 5 services to cloud
2. Reduce downtime by 50%
3. Deploy new API gateway

[Show BAU Management page]

She also defines what 'business as usual' looks like for operations:
- Incident Management with SLA and response time targets
- System Reliability with uptime and error rate targets

These are the baseline metrics we need to maintain while pursuing new goals."
```

**[3:00 - 5:00] Monthly Planning & Weekly Execution**
```
"Each month, the team breaks down their goals into concrete work.

[Show Monthly Planning page]

For January, they created work items like:
- 'Migrate authentication service' (supports KR1)
- 'Implement auto-failover' (supports KR2)
- 'Deploy security patches' (BAU maintenance)

[Show Weekly Planning page]

Every Monday, they pick priorities for the week and break them into tasks.

Here's this week's plan:
- Priority 1: Migrate auth service (5 tasks)
- Priority 1: Deploy security patches (3 tasks)

[Show task list]

Team members update their tasks daily. You can see:
- 2 tasks completed (green checkmarks)
- 1 in progress
- 2 not started yet"
```

**[5:00 - 8:00] Performance Dashboard**
```
"Now here's the powerful part - the dashboard.

[Show Dashboard page]

In one view, you see everything:

📊 OKR Progress: 42%
- KR1 is at 80% (migration going well)
- KR2 at 40% (some work done)
- KR3 at 20% (just started)

💚 BAU Health: 95%
- Incident Management: 93% (slightly below target on SLA)
- System Reliability: 97% (excellent uptime)

This updates in real-time as the team completes tasks.

[Show trend chart]

Here's the weekly trend - you can see steady progress over the quarter.

If something goes wrong - like SLA drops below 90% - we immediately see 
it turn red and can investigate."
```

**[8:00 - 9:30] Value Proposition**
```
"So what does this give you?

1. Visibility - See team performance instantly, no waiting for reports
2. Balance - Track both innovation (OKRs) and operations (BAU) 
3. Accountability - Every piece of work links to a goal
4. Early Warning - Problems show up immediately, not in quarterly reviews
5. Data-Driven - All progress calculated automatically, no guesswork

Your teams spend 30 minutes on Monday planning, 5 minutes daily updating,
and you get real-time visibility into what's happening across the bank."
```

**[9:30 - 10:00] Q&A**
```
"Questions?"

Common questions:
Q: "Can I see multiple teams?"
A: "Yes, executives have a cross-team view showing all teams side-by-side."

Q: "What if priorities change mid-week?"
A: "Team leads can re-prioritize anytime. The system tracks changes."

Q: "How do we handle unplanned work?"
A: "Ad-hoc work items can be created anytime and added to weekly plans."
```

---

## 12. Success Metrics

### 12.1 Technical Metrics

**System Performance:**
- [ ] API response time < 500ms (95th percentile)
- [ ] Dashboard loads < 2 seconds
- [ ] Database queries < 100ms
- [ ] 99% uptime

**Code Quality:**
- [ ] >80% test coverage
- [ ] Zero critical security vulnerabilities
- [ ] All code reviewed before merge
- [ ] Documentation complete

### 12.2 User Adoption Metrics

**Week 1-2:**
- [ ] 1 pilot team onboarded
- [ ] Team lead completes setup in <30 minutes
- [ ] 80% of team members update tasks daily

**Week 3-4:**
- [ ] Team completes 2 weekly planning cycles
- [ ] Dashboard viewed daily by team lead
- [ ] OKR progress reflects reality (validated by team)

**Week 5-6:**
- [ ] Executive reviews dashboard weekly
- [ ] Decision made using system data
- [ ] Team reports system is useful

### 12.3 Business Value Metrics

**Efficiency Gains:**
- Planning time reduced from 2 hours → 30 minutes
- Status updates automated (no more status emails)
- Executive reporting instant (no manual reports)

**Visibility Improvement:**
- Team performance visible in <1 minute
- Problems identified same day (vs. next week)
- Capacity utilization measurable

---

## 13. Risk Management

### 13.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Database performance issues | High | Medium | Add indexes, optimize queries, test with realistic data |
| Authentication vulnerabilities | High | Low | Use proven libraries (PyJWT), security audit before launch |
| Frontend performance on mobile | Medium | Medium | Responsive design, test on devices, optimize bundle size |
| Data loss during deployment | High | Low | Automated backups, test restore process, blue-green deployment |
| API rate limiting needed | Low | Medium | Add rate limiting before scaling beyond pilot |

### 13.2 Adoption Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Team doesn't update daily | High | Medium | Make updates easy (2 clicks), show value in dashboard |
| OKR progress doesn't match reality | High | Medium | Weekly validation with team, adjust calculation if needed |
| System too complex for users | Medium | Low | Simple UI, clear documentation, training session |
| CEO doesn't see value | High | Low | Strong demo script, show real data, highlight insights |

### 13.3 Schedule Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Backend takes longer than planned | Medium | Medium | Start with core features, defer nice-to-haves |
| Frontend polish takes extra time | Low | High | Set strict feature cutoff, use component library |
| Integration issues at deployment | Medium | Low | Deploy early, test continuously |
| Demo prep takes longer than expected | Low | Medium | Seed data early, practice demo multiple times |

---

## 14. Post-MVP Roadmap

### Phase 4: Enhancements (Week 7-10)

**Feature Additions:**
- [ ] Cross-team dashboard (executive view)
- [ ] Notification system (Slack/email)
- [ ] Advanced filtering and search
- [ ] Custom report builder
- [ ] Data export (PDF reports)

**Integrations:**
- [ ] ServiceNow for incident data
- [ ] Jira for ticket data
- [ ] Datadog for uptime metrics
- [ ] Google Calendar for planning

**Performance:**
- [ ] Caching layer (Redis)
- [ ] Real-time updates (WebSockets)
- [ ] Database optimization
- [ ] Load testing and scaling

### Phase 5: Scale (Week 11-14)

**Multi-team Support:**
- [ ] 10+ teams using system
- [ ] Cross-team dependencies
- [ ] Resource allocation view
- [ ] Portfolio-level dashboard

**Advanced Analytics:**
- [ ] Predictive completion estimates
- [ ] Capacity planning tools
- [ ] Historical trend analysis
- [ ] Benchmark across teams

**Mobile:**
- [ ] Mobile-optimized UI
- [ ] Progressive Web App (PWA)
- [ ] Mobile notifications

---

## 15. Documentation Plan

### 15.1 Technical Documentation

**API Documentation:**
- Auto-generated with FastAPI/Swagger
- Include request/response examples
- Authentication guide
- Error codes reference

**Architecture Documentation:**
- System architecture diagram
- Data flow diagrams
- Database schema with relationships
- Deployment architecture

**Developer Guide:**
- Setup instructions
- Coding standards
- Testing guidelines
- Contribution process

### 15.2 User Documentation

**User Guide:**
- Getting started
- Quarterly setup (OKRs & BAU)
- Monthly planning
- Weekly execution
- Dashboard interpretation

**Admin Guide:**
- User management
- Team setup
- System configuration
- Backup and restore

**Video Tutorials:**
- 5-minute system overview
- Setting up your first OKR
- Weekly planning walkthrough
- Understanding the dashboard

---

## 16. Handoff & Training

### 16.1 CEO Handoff Package

**Deliverables:**
- [ ] Live system access (URL + credentials)
- [ ] Demo data populated
- [ ] User guide (PDF)
- [ ] Demo video recording
- [ ] Architecture overview (1-page)
- [ ] Success metrics dashboard

### 16.2 Team Lead Training

**Session 1: System Overview (30 min)**
- What the system does
- How it helps your team
- Tour of main features

**Session 2: Quarterly Setup (45 min)**
- Creating OKRs
- Setting up BAU activities
- Best practices for goal-setting

**Session 3: Weekly Operations (30 min)**
- Monthly planning workflow
- Weekly planning workflow
- Task management
- Dashboard interpretation

### 16.3 Team Member Training

**Quick Start Guide (15 min)**
- Logging in
- Finding your tasks
- Updating task status
- Viewing team progress

---

## 17. Support Plan

### 17.1 During MVP (Week 1-6)

**Developer Support:**
- Daily standup (15 min)
- Issue tracking in GitHub
- Slack channel for questions
- Weekly progress review

### 17.2 Post-Launch Support

**User Support:**
- Slack support channel
- Email support (response within 24 hours)
- Office hours (1 hour/week)
- Bug reporting process

**System Monitoring:**
- Uptime monitoring (UptimeRobot)
- Error logging (Sentry)
- Performance monitoring (Railway dashboard)
- Weekly health check

---

## 18. Budget & Resources

### 18.1 Infrastructure Costs (Monthly)

**Development (Free Tier):**
- Railway Backend: $0 (512MB RAM, 500 hours)
- Railway PostgreSQL: $0 (1GB storage)
- Vercel Frontend: $0 (100GB bandwidth)
- **Total: $0/month**

**Production (Estimated):**
- Railway Backend: $5-20 (depending on usage)
- Railway PostgreSQL: $5-10 (depending on data size)
- Vercel Frontend: $20 (Pro plan for custom domain)
- Custom Domain: $12/year
- **Total: ~$30-50/month**

### 18.2 Development Resources

**Team:**
- 1 Full-stack Developer (6 weeks)
- 1 UI/UX Designer (2 weeks, part-time)
- 1 QA Tester (1 week)
- 1 Technical Writer (1 week for documentation)

**Tools:**
- IDEs (VS Code - Free)
- Design tools (Figma - Free tier)
- Project management (GitHub - Free)
- Communication (Slack - Free tier)

---

## 19. Quality Checklist

### 19.1 Pre-Deployment Checklist

**Code Quality:**
- [ ] All unit tests passing
- [ ] Integration tests complete
- [ ] No console errors
- [ ] Code reviewed
- [ ] Documentation updated

**Security:**
- [ ] Passwords hashed with bcrypt
- [ ] JWT tokens implemented correctly
- [ ] HTTPS enabled
- [ ] SQL injection prevented
- [ ] XSS prevention verified
- [ ] CORS configured properly

**Performance:**
- [ ] API responses < 500ms
- [ ] Dashboard loads < 2 seconds
- [ ] Database queries optimized
- [ ] Images optimized
- [ ] Bundle size < 500KB

**Functionality:**
- [ ] Authentication works
- [ ] All CRUD operations work
- [ ] Calculations are accurate
- [ ] Dashboard displays correctly
- [ ] Mobile responsive

**Data:**
- [ ] Database backed up
- [ ] Demo data seeded
- [ ] Migrations tested
- [ ] Data validation works

### 19.2 Post-Deployment Checklist

- [ ] Health check endpoint responding
- [ ] Frontend loads correctly
- [ ] Can login successfully
- [ ] Can create OKR
- [ ] Can update task
- [ ] Dashboard shows data
- [ ] No errors in logs
- [ ] Database connected
- [ ] Backups running

---

## 20. Next Steps

### Immediate Actions (Today)

1. **Get Approval**
   - Review this plan with stakeholders
   - Get CEO sign-off
   - Confirm timeline and resources

2. **Setup Development Environment**
   - Create GitHub repository
   - Setup local PostgreSQL
   - Initialize backend project
   - Initialize frontend project

3. **Start Week 1**
   - Begin database schema implementation
   - Setup FastAPI project structure
   - Create initial models

### Week 1 Deliverable

**End of Week 1 Demo:**
- Backend API running locally
- Authentication working
- Can create teams and users
- Can create OKRs
- API documentation available

---

## 21. Contact & Escalation

### Development Team

**Technical Lead:** [Name]
- Email: [email]
- Slack: @[handle]
- Escalation: For technical blockers

**Project Manager:** [Name]
- Email: [email]
- Slack: @[handle]
- Escalation: For timeline/resource issues

### Stakeholders

**CEO/Sponsor:** [Name]
- Weekly progress updates
- Major decision approval
- Final demo and sign-off

**Pilot Team Lead:** [Name]
- Daily collaboration during testing
- Feedback on features
- User acceptance testing

---

## Appendix A: Environment Setup Commands

### Backend Setup (Detailed)

```bash
# Create project structure
mkdir -p tpes-system/backend/app/routers
mkdir -p tpes-system/backend/app/utils
mkdir -p tpes-system/backend/tests
cd tpes-system/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install core dependencies
pip install fastapi uvicorn[standard] sqlalchemy psycopg2-binary
pip install alembic pydantic python-jose[cryptography]
pip install passlib[bcrypt] python-multipart pytest httpx

# Save requirements
pip freeze > requirements.txt

# Initialize Alembic
alembic init alembic

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://user:password@localhost:5432/tpes_db
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF

# Create database
createdb tpes_db

# Run first migration
alembic upgrade head
```

### Frontend Setup (Detailed)

```bash
cd tpes-system

# Create Vite + React + TypeScript project
npm create vite@latest frontend -- --template react-ts
cd frontend

# Install dependencies
npm install
npm install react-router-dom @tanstack/react-query axios
npm install tailwindcss postcss autoprefixer
npm install lucide-react recharts
npm install react-hook-form

# Initialize Tailwind
npx tailwindcss init -p

# Create .env file
cat > .env << EOF
VITE_API_URL=http://localhost:8000
EOF

# Run dev server
npm run dev
```

---

## Appendix B: Git Workflow

### Branch Strategy

```
main (production)
  └── develop (staging)
      ├── feature/okr-management
      ├── feature/bau-management
      ├── feature/weekly-planning
      └── feature/dashboard
```

### Commit Convention

```
feat: Add OKR creation endpoint
fix: Correct progress calculation for empty work items
docs: Update API documentation
test: Add unit tests for BAU health calculation
refactor: Simplify dashboard query logic
```

---

## Appendix C: Sample Data JSON

```json
{
  "team": {
    "name": "Engineering Team"
  },
  "okr": {
    "quarter": "Q1 2026",
    "objective": "Modernize Core Banking Infrastructure",
    "key_results": [
      {
        "description": "Migrate 5 services to cloud",
        "target_value": 5,
        "unit": "services"
      },
      {
        "description": "Reduce system downtime by 50%",
        "target_value": 2,
        "unit": "hours/month"
      },
      {
        "description": "Deploy new API gateway",
        "target_value": 100,
        "unit": "%"
      }
    ]
  },
  "bau_activities": [
    {
      "name": "Incident Management",
      "metrics": [
        {
          "name": "SLA Adherence",
          "target_value": 95,
          "unit": "%",
          "weight": 0.5
        },
        {
          "name": "MTTR",
          "target_value": 30,
          "unit": "minutes",
          "weight": 0.5,
          "is_higher_better": false
        }
      ]
    },
    {
      "name": "System Reliability",
      "metrics": [
        {
          "name": "Uptime",
          "target_value": 99.9,
          "unit": "%",
          "weight": 0.6
        },
        {
          "name": "Error Rate",
          "target_value": 0.5,
          "unit": "%",
          "weight": 0.4,
          "is_higher_better": false
        }
      ]
    }
  ]
}
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-19 | System Architect | Initial implementation plan |

---

**End of Implementation Plan**

---

## 🚀 Ready to Start?

**This plan provides:**
✅ Complete technical specifications  
✅ Detailed 6-week timeline  
✅ All code structures and schemas  
✅ Deployment instructions  
✅ Demo script for CEO  
✅ Post-MVP roadmap  

**Next Step:** Get approval and begin Week 1! 🎯