# Compass Backend - Team Performance & Execution System

FastAPI backend for tracking strategic goals (OKRs) and operational health (BAU) metrics.

## Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 15
- pip

### Setup

1. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Setup environment:**
```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and SECRET_KEY
```

4. **Create database:**
```bash
createdb tpes_db
```

5. **Run migrations (when available):**
```bash
alembic upgrade head
```

6. **Start development server:**
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
- API docs: `http://localhost:8000/docs` (Swagger UI)
- Alternative docs: `http://localhost:8000/redoc` (ReDoc)

## Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI entry point
│   ├── database.py             # Database connection & session
│   ├── models.py               # SQLAlchemy ORM models
│   ├── schemas.py              # Pydantic validation schemas
│   ├── auth.py                 # JWT authentication
│   ├── calculations.py         # Progress & health calculations
│   ├── routers/
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── teams.py           # Team management
│   │   ├── okrs.py            # OKR management
│   │   ├── bau.py             # BAU activities & metrics
│   │   ├── work_items.py      # Work items & tasks
│   │   └── planning_dashboard.py  # Planning & dashboard
│   └── utils/
│       └── dependencies.py    # FastAPI dependencies
├── tests/                      # Test suite
├── requirements.txt
├── .env.example
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns JWT token)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Teams
- `GET /api/teams` - List all teams
- `POST /api/teams` - Create team
- `GET /api/teams/{id}` - Get team details
- `GET /api/teams/{id}/users` - List team users
- `POST /api/teams/{id}/users` - Add user to team

### OKRs
- `POST /api/teams/{id}/okrs` - Create OKR
- `GET /api/teams/{id}/okrs` - List team OKRs
- `GET /api/okrs/{id}` - Get OKR details
- `PUT /api/okrs/{id}` - Update OKR
- `DELETE /api/okrs/{id}` - Archive OKR
- `POST /api/okrs/{id}/key-results` - Add key result
- `PUT /api/key-results/{id}` - Update key result
- `GET /api/key-results/{id}/progress` - Get KR progress
- `GET /api/okrs/{id}/progress` - Get OKR progress

### BAU
- `POST /api/teams/{id}/bau` - Create BAU activity
- `GET /api/teams/{id}/bau` - List BAU activities
- `GET /api/bau/{id}` - Get BAU details
- `PUT /api/bau/{id}` - Update BAU activity
- `POST /api/bau/{id}/metrics` - Add metric
- `PATCH /api/bau-metrics/{id}` - Update metric
- `GET /api/bau/{id}/health` - Get BAU health score
- `GET /api/bau-metrics/{id}/history` - Get metric history

### Work Items & Tasks
- `POST /api/work-items` - Create work item
- `GET /api/work-items` - List work items
- `GET /api/work-items/{id}` - Get work item details
- `PUT /api/work-items/{id}` - Update work item
- `POST /api/work-items/{id}/tasks` - Create task
- `GET /api/tasks/{id}` - Get task details
- `PATCH /api/tasks/{id}` - Update task
- `GET /api/users/{id}/tasks` - Get user's tasks

### Weekly Planning
- `POST /api/weekly-priorities` - Set weekly priority
- `GET /api/weekly-priorities` - List priorities
- `PUT /api/weekly-priorities/{id}` - Update priority
- `DELETE /api/weekly-priorities/{id}` - Delete priority

### Dashboard
- `GET /api/teams/{id}/dashboard` - Get team dashboard
- `GET /api/teams/{id}/performance` - Get performance trend

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Getting a Token

1. Register a user:
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123","role":"member"}'
```

2. Login:
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

## Key Calculations

### Work Item Progress
- Calculated from task completion percentage
- 0% if no tasks, 100% if all tasks done
- Example: 3/5 tasks done = 60% progress

### Key Result Progress
- Average progress of related work items
- Work items must have source_type="OKR" and source_id=kr_id
- Current value is updated based on progress

### OKR Progress
- Average of all key result progress values
- Provides overall objective completion percentage

### BAU Health Score
- Weighted average of metric achievements
- Each metric calculated as: (current/target) * 100
- For "lower is better" metrics: (target/current) * 100
- Capped at 100%, weighted by metric.weight

## Database Schema

See `models.py` for complete schema. Key tables:
- `users` - Team members
- `teams` - Organizations
- `okrs` - Strategic goals
- `key_results` - Measurable results for OKRs
- `bau_activities` - Business as usual activities
- `bau_metrics` - Operational health metrics
- `work_items` - Monthly work items
- `tasks` - Weekly task breakdown
- `weekly_priorities` - Priority assignment
- `metric_history` - Historical metric values

## Testing

Run tests:
```bash
pytest
```

Run with coverage:
```bash
pytest --cov=app
```

## Environment Variables

```
DATABASE_URL=postgresql://user:password@localhost:5432/tpes_db
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=True
```

## Development

### Adding a New Endpoint

1. Create or update router in `app/routers/`
2. Add schema to `app/schemas.py` if needed
3. Update main.py to include router
4. Test with Swagger UI at `/docs`

### Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Production Deployment

### Railway Deployment

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Initialize and deploy:
```bash
railway init
railway add postgresql
railway variables set SECRET_KEY="your-secret"
railway up
```

3. Run migrations:
```bash
railway run alembic upgrade head
```

### Docker Deployment

```bash
docker build -t tpes-backend .
docker run -e DATABASE_URL="postgresql://..." -p 8000:8000 tpes-backend
```

## Troubleshooting

### Database Connection Error
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Verify database exists: `psql -l | grep tpes_db`

### JWT Token Errors
- Token may have expired (default 30 minutes)
- Get a new token by logging in again
- Check SECRET_KEY matches between sessions

### Port Already in Use
```bash
# Change port
uvicorn app.main:app --port 8001
```

## License

Proprietary - Team Performance & Execution System

## Support

For issues or questions, contact the development team.

