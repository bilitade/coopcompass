# CoopCompass - Team Performance & Execution System

A comprehensive team performance management system for tracking OKRs, BAU activities, work items, and tasks with AI-powered planning and validation.

## Architecture

- **Backend**: FastAPI (Python 3.12)
- **Frontend**: React + TypeScript + Vite
- **Database**: PostgreSQL
- **AI Engine**: LangChain + OpenAI for planning and validation

## Project Structure

```
coopcompasslatest/
├── backend/                    # FastAPI backend
│   ├── app/                   # Application code
│   │   ├── api/              # API routes
│   │   ├── core/             # Core configuration (database, security, config)
│   │   ├── models/            # SQLAlchemy models
│   │   ├── modules/           # Feature modules
│   │   │   ├── auth/         # Authentication
│   │   │   ├── users/        # User management
│   │   │   ├── teams/        # Team management
│   │   │   ├── departments/  # Department management
│   │   │   ├── okrs/         # OKR management
│   │   │   ├── bau/          # BAU activities
│   │   │   ├── tasks/        # Task management
│   │   │   ├── work_items/   # Work items
│   │   │   ├── snapshots/    # Weekly snapshots
│   │   │   └── ai_engine/    # AI-powered features
│   │   ├── routers/          # Router definitions
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utility functions
│   ├── migrations/            # Database migrations
│   ├── scripts/              # Utility scripts
│   ├── tests/                # Test files
│   ├── Dockerfile            # Backend Docker image
│   ├── requirements.txt     # Python dependencies
│   ├── seed_data.py         # Database seeding script
│   ├── init-db.sh           # Database initialization script
│   └── .env                  # Backend environment variables
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── app/             # App configuration (routes, context)
│   │   ├── features/        # Feature modules
│   │   └── shared/          # Shared components and utilities
│   ├── Dockerfile           # Frontend Docker image
│   ├── nginx.conf           # Nginx configuration
│   └── package.json         # Node dependencies
├── docker-compose.yml        # Docker Compose configuration
├── docker.sh                 # Docker helper script
└── README.md                 # This file
```

## Prerequisites

- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)
- **Git**

## Running Locally

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd coopcompasslatest
   ```

2. **Create backend environment file** (`backend/.env`)
   ```bash
   DATABASE_URL=postgresql://postgres:postgres@db:5432/coopcompass
   SECRET_KEY=your-super-secret-key-change-this-in-production
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   DEBUG=False
   
   # AI/LLM Configuration (optional)
   OPENAI_API_KEY=your-openai-api-key
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_API_KEY=your-langchain-api-key
   LANGCHAIN_PROJECT=coopcompass
   LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
   ```

3. **Optional: Create root `.env` file** (for custom Docker settings)
   ```bash
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=coopcompass
   POSTGRES_PORT=5433
   BACKEND_PORT=8000
   FRONTEND_PORT=3000
   AUTO_SEED=true
   VITE_API_URL=
   SECRET_KEY=your-super-secret-key-change-this-in-production
   DEBUG=False
   ```

   **Note:** If you don't create a root `.env` file, Docker Compose will use default values from `docker-compose.yml`.

4. **Start all services**
   ```bash
   docker-compose up -d --build
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

   The database will be **automatically created and seeded** on first startup. If the database is empty (no users), it will automatically clear any existing partial data and seed fresh demo data.

6. **Useful commands**
   ```bash
   # View logs
   docker-compose logs -f

   # Stop services
   docker-compose down

   # Restart services
   docker-compose restart

   # Use helper script
   ./docker.sh start    # Start services
   ./docker.sh stop     # Stop services
   ./docker.sh logs     # View logs
   ./docker.sh seed     # Seed database
   ```

### Option 2: Local Development (without Docker)

**Backend Setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create backend/.env file with:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/coopcompass
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=True
OPENAI_API_KEY=your-openai-api-key  # optional

# Start server
uvicorn app.main:app --reload
```

**Frontend Setup:**
```bash
cd frontend
npm install

# Set API URL (optional, defaults to http://localhost:8000)
export VITE_API_URL=http://localhost:8000

# Start development server
npm run dev
```

## Database Management

### Automatic Setup

The database is automatically:
- Created on first startup (PostgreSQL container)
- Tables are created automatically via SQLAlchemy
- **Automatically seeded** when empty (if `AUTO_SEED=true`, which is the default)

**Automatic Seeding Behavior:**
- When the database is detected as empty (no users), the system will:
  - Automatically clear any existing partial data (departments, teams, etc.)
  - Seed the database with comprehensive demo data
- This ensures a clean, consistent state on first startup or after data cleanup
- The seeding process is CLI-compliant and works seamlessly via SSH/AWS deployments

### Manual Database Operations

**Seed database:**
```bash
# Via Docker (safe: only seeds if empty)
docker-compose exec -T backend python seed_data.py

# Via helper script
./docker.sh seed

# Force reseed (clears existing data first)
./docker.sh seed --force
./docker.sh seed-force
```

**Seed script options:**
```bash
python seed_data.py                    # Safe: only seed if empty, skip if data exists
python seed_data.py --clear-existing   # Clear existing data, then seed
python seed_data.py --force            # Force seed (clears first, same as --clear-existing)
python seed_data.py --drop-schema      # Drop schema and recreate (DESTRUCTIVE - all data lost!)
```

**Note:** When running automatically via `init-db.sh` (during Docker startup), the script uses `--clear-existing` by default when the database is empty to ensure clean seeding.

## Default Credentials

All demo users have password: `password123`

**Executives:**
- `deribe@bank.com` - Chief Executive Officer
- `aman@bank.com` - Chief Transformation and Strategy Officer

**Directors:**
- `hailagegn@bank.com` - Director of Payment Platform
- `samuel@bank.com` - Director of Core Banking System
- `iyob@bank.com` - Director of Central Finfine District

**Team Leads:**
- `zidan@bank.com` - ATM Monitoring Team
- `birhanemeskel@bank.com` - Card Production Team
- `regasa@bank.com` - T24 Application Team
- `tesfahun@bank.com` - Application Integration Team
- `samson@bank.com` - Ijo Branch

**Admin:**
- `admin@bank.com`

## Deployment

### AWS/SSH Deployment

1. **SSH into your server**
   ```bash
   ssh user@your-server
   ```

2. **Clone and navigate to project**
   ```bash
   git clone <repository-url>
   cd coopcompasslatest
   ```

3. **Create environment files**
   
   **Backend `.env` file** (`backend/.env`):
   ```bash
   DATABASE_URL=postgresql://postgres:<strong-password>@db:5432/coopcompass
   SECRET_KEY=<generate-strong-random-key>
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   DEBUG=False
   OPENAI_API_KEY=your-openai-api-key
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_API_KEY=your-langchain-api-key
   LANGCHAIN_PROJECT=coopcompass
   LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
   ```
   
   **Root `.env` file** (optional, for custom Docker settings):
   ```bash
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=<strong-password>
   POSTGRES_DB=coopcompass
   POSTGRES_PORT=5433
   BACKEND_PORT=8000
   FRONTEND_PORT=3000
   AUTO_SEED=true
   VITE_API_URL=
   SECRET_KEY=<same-as-backend/.env>
   DEBUG=False
   ```

4. **Start services**
   ```bash
   docker-compose up -d --build
   ```

5. **Verify services are running**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

6. **Verify database seeding**
   - The database is automatically seeded on first startup if empty
   - To manually reseed (clears existing data):
     ```bash
     docker-compose exec -T backend python seed_data.py --clear-existing
     ```

### Production Considerations

**Security:**
- Change `SECRET_KEY` to a strong random value
- Use strong database passwords
- Set `DEBUG=False`
- Configure proper CORS origins in `backend/app/core/config.py`
- Use environment variables for sensitive data

**Performance:**
- Use production-grade PostgreSQL settings
- Configure Nginx caching appropriately
- Consider using a reverse proxy (Traefik, Nginx) in front

**Backup:**
- Regularly backup the `postgres_data` Docker volume
- Set up automated backups

## Environment Variables

### Backend `.env` file (`backend/.env`)

**Required:**
```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/coopcompass
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=False
```

**Optional (AI/LLM):**
```env
OPENAI_API_KEY=your-openai-api-key
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-langchain-api-key
LANGCHAIN_PROJECT=coopcompass
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
```

### Root `.env` file (optional, for Docker Compose)

If you want to override Docker Compose defaults, create a root `.env` file:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=coopcompass
POSTGRES_PORT=5433
BACKEND_PORT=8000
FRONTEND_PORT=3000
AUTO_SEED=true
VITE_API_URL=
SECRET_KEY=your-super-secret-key
DEBUG=False
```

**Database Seeding Control:**
- `AUTO_SEED=true` (default): Automatically seed database when empty on startup
- `AUTO_SEED=false`: Skip automatic seeding (manual seeding required)
- `CLEAR_EXISTING_DATA=true`: Clear existing data before seeding (when AUTO_SEED is enabled)
- `FORCE_SEED=true`: Force seeding with data clearing (same as CLEAR_EXISTING_DATA)
- `DROP_SCHEMA=true`: Drop and recreate schema before seeding (DESTRUCTIVE - use with caution!)

**Note:** 
- The backend application reads from `backend/.env` when running locally
- Docker Compose reads from root `.env` (if exists) and passes variables to containers
- If root `.env` doesn't exist, Docker Compose uses defaults from `docker-compose.yml`
- When `AUTO_SEED=true` and the database is empty, the system automatically uses `--clear-existing` to ensure clean seeding

## Testing

```bash
# Backend tests
cd backend
pytest

# Run tests in Docker
docker-compose exec -T backend pytest
```

## Troubleshooting

**Port conflicts:**
- Change port mappings in root `.env` file or `docker-compose.yml` (POSTGRES_PORT, BACKEND_PORT, FRONTEND_PORT)

**Database connection issues:**
- Verify database service is healthy: `docker-compose ps`
- Check database logs: `docker-compose logs db`
- Verify `DATABASE_URL` in `backend/.env` matches Docker service name `db` for Docker, or `localhost` for local development

**Frontend can't reach backend:**
- Check nginx configuration in `frontend/nginx.conf`
- Verify backend is running: `docker-compose ps backend`
- Check backend logs: `docker-compose logs backend`

**Rebuild after code changes:**
```bash
# Rebuild specific service
docker-compose up -d --build backend
docker-compose up -d --build frontend

# Rebuild all
docker-compose up -d --build
```

## Additional Resources

- [System Specification](coopcompass_specification.md) - Complete system specification
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Docker Documentation](https://docs.docker.com/)

## License

[Add your license here]
