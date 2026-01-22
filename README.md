# Compass - Team Performance & Execution System

[![Status](https://img.shields.io/badge/status-operational-brightgreen)]()
[![Backend](https://img.shields.io/badge/backend-FastAPI-009688)]()
[![Frontend](https://img.shields.io/badge/frontend-React-61DAFB)]()
[![Database](https://img.shields.io/badge/database-PostgreSQL-336791)]()

## 🎯 Overview

Compass is a comprehensive team performance and execution system designed for banking organizations. It provides unified tracking of both strategic goals (OKRs) and operational health (BAU) with role-based visibility across the organization.

## 📚 Documentation

- **[Business Requirements](./Business%20requirement.md)** - Complete business requirements and system specifications
- **[Implementation Plan](./implementation.md)** - Technical implementation details and architecture

## ✨ Key Features

### Core Capabilities
- **OKR Management** - Quarterly objective setting with measurable key results
- **BAU Tracking** - Operational health metrics and continuous monitoring
- **Work Item Management** - Monthly planning linked to strategic and operational goals
- **Weekly Priorities** - Focused weekly execution with task breakdown
- **Automated Calculations** - Real-time progress and health score computation
- **Role-Based Dashboards** - Customized views for each organizational level

### Organizational Structure
- **Hierarchical Organization** - Organization → Departments → Teams
- **Role-Based Access Control** - 5 roles (Member, Lead, Director, Executive, Admin)
- **Department Management** - Director assignment and department-level oversight
- **Team Management** - Team composition and member assignment

### User Experience
- **Professional UI** - Clean, business-focused interface
- **Hierarchical Navigation** - Drill-down from organization to team level
- **Breadcrumb Navigation** - Easy traversal between levels
- **Dark Mode** - Full dark mode support
- **Responsive Design** - Works on all screen sizes

## 🏗️ Architecture

### Technology Stack

**Backend:**
- FastAPI 0.104+ (Python 3.11+)
- PostgreSQL 15
- SQLAlchemy 2.0 ORM
- JWT Authentication
- Alembic Migrations

**Frontend:**
- React 18
- TypeScript 5.0+
- Vite 5
- Tailwind CSS
- React Router v6
- Axios
- Lucide React Icons

### Project Structure

```
coopcompasslatest/
├── backend/
│   ├── app/
│   │   ├── routers/         # API endpoints
│   │   ├── models.py        # Database models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── auth.py          # Authentication
│   │   ├── calculations.py  # Progress/health calculations
│   │   └── database.py      # Database connection
│   └── alembic/             # Database migrations
├── frontend/
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API services
│   │   ├── context/         # React context
│   │   └── types.ts         # TypeScript types
│   └── public/              # Static assets
├── Business requirement.md   # Business specifications
└── implementation.md         # Technical documentation
```

## 👥 User Roles

### Member
- View team dashboard
- Update assigned tasks
- View team OKRs and BAU activities

### Team Lead
- Manage team OKRs and key results
- Manage BAU activities and metrics
- Create and assign work items and tasks
- Set weekly priorities
- View team performance

### Director
- View all teams in assigned department
- Monitor department-level performance
- View aggregated OKR and BAU lists
- Drill down to team details

### Executive
- Organization-wide visibility
- View all departments and teams
- Access aggregated OKR and BAU lists
- Monitor overall organization performance

### Admin
- Full system management
- User, department, and team management
- Organization-wide visibility
- System configuration

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15
- npm or yarn

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and SECRET_KEY

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with VITE_API_URL

# Start development server
npm run dev
```

## 📊 Key Workflows

### Quarterly Setup
1. Create OKRs with key results
2. Define BAU activities and metrics
3. Set baseline targets

### Monthly Planning (Heads-Up)
1. Review quarterly OKRs
2. Create work items from OKRs and BAU
3. Assign owners to work items

### Weekly Execution
1. **Monday:** Select priorities from work items
2. **Monday:** Break priorities into tasks
3. **Daily:** Update task status
4. **Friday:** Review progress and metrics

### Performance Monitoring
- Real-time dashboard updates
- Automated progress calculations
- Health score tracking
- Drill-down analysis

## 🎨 UI Principles

- **Professional** - Clean, business-focused design
- **Intuitive** - Clear information hierarchy
- **Accessible** - WCAG compliant
- **Responsive** - Mobile-first approach
- **Consistent** - Unified design system

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- SQL injection prevention
- XSS protection
- HTTPS enforcement (production)

## 📈 Metrics & Calculations

### OKR Progress
```
Task Progress → Work Item Progress → KR Progress → OKR Progress
```

### BAU Health
```
Metric Achievement × Weight → Activity Health → Team BAU Health
```

### Dashboard Aggregation
- Team-level metrics
- Department-level averages
- Organization-wide summaries

## 🛠️ Development

### Code Style
- Python: PEP 8
- TypeScript: ESLint + Prettier
- Git: Conventional Commits

### Testing
```bash
# Backend tests
pytest

# Frontend tests
npm test
```

## 📝 License

Proprietary - All rights reserved

## 🤝 Contributing

This is an internal project. For questions or issues, contact the development team.

---

**Built with ❤️ for effective team execution and performance tracking**

