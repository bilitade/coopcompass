#!/bin/bash

# Docker helper script for CoopCompass

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env exists
if [ ! -f .env ]; then
    print_warn ".env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_info ".env file created. Please review and update the values."
    else
        print_error ".env.example not found. Please create .env manually."
        exit 1
    fi
fi

# Parse command
case "${1:-}" in
    start|up)
        print_info "Starting CoopCompass services..."
        docker-compose up -d
        print_info "Services started!"
        print_info "Frontend: http://localhost"
        print_info "Backend API: http://localhost:8000"
        print_info "API Docs: http://localhost:8000/docs"
        ;;
    
    stop|down)
        print_info "Stopping CoopCompass services..."
        docker-compose down
        print_info "Services stopped!"
        ;;
    
    restart)
        print_info "Restarting CoopCompass services..."
        docker-compose restart
        print_info "Services restarted!"
        ;;
    
    build)
        print_info "Building CoopCompass services..."
        docker-compose build
        print_info "Build complete!"
        ;;
    
    rebuild)
        print_info "Rebuilding CoopCompass services..."
        docker-compose up -d --build
        print_info "Rebuild complete!"
        ;;
    
    logs)
        SERVICE="${2:-}"
        if [ -z "$SERVICE" ]; then
            print_info "Showing logs for all services (Ctrl+C to exit)..."
            docker-compose logs -f
        else
            print_info "Showing logs for $SERVICE (Ctrl+C to exit)..."
            docker-compose logs -f "$SERVICE"
        fi
        ;;
    
    shell|exec)
        SERVICE="${2:-backend}"
        print_info "Opening shell in $SERVICE container..."
        docker-compose exec "$SERVICE" bash
        ;;
    
    db)
        print_info "Opening PostgreSQL shell..."
        docker-compose exec db psql -U postgres -d coopcompass
        ;;
    
    clean)
        print_warn "This will remove all containers, networks, and volumes!"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Cleaning up Docker resources..."
            docker-compose down -v
            print_info "Cleanup complete!"
        else
            print_info "Cleanup cancelled."
        fi
        ;;
    
    status|ps)
        print_info "Service status:"
        docker-compose ps
        ;;
    
    seed)
        FLAGS=""
        if [ "${2:-}" = "--clear-existing" ] || [ "${2:-}" = "--force" ]; then
            FLAGS="$2"
            print_warn "Clearing existing data before seeding..."
        elif [ "${2:-}" = "--drop-schema" ]; then
            FLAGS="$2"
            print_warn "Dropping schema (destructive!) before seeding..."
        fi
        
        print_info "Seeding database with comprehensive data..."
        docker-compose exec -T backend python seed_data.py $FLAGS
        print_info "Database seeded!"
        ;;
    
    seed-minimal)
        print_info "Seeding database with minimal data..."
        docker-compose exec -T backend python seed_minimal.py
        print_info "Database seeded!"
        ;;
    
    seed-force)
        print_warn "Force seeding: clearing existing data..."
        docker-compose exec -T backend python seed_data.py --force
        print_info "Database force-seeded!"
        ;;
    
    migrate)
        print_info "Running database migrations..."
        docker-compose exec backend python -m alembic upgrade head
        print_info "Migrations complete!"
        ;;
    
    help|--help|-h)
        echo "CoopCompass Docker Helper Script"
        echo ""
        echo "Usage: ./docker.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start, up          Start all services"
        echo "  stop, down         Stop all services"
        echo "  restart            Restart all services"
        echo "  build              Build all services"
        echo "  rebuild            Rebuild and start all services"
        echo "  logs [service]     Show logs (all services or specific service)"
        echo "  shell [service]    Open shell in container (default: backend)"
        echo "  db                 Open PostgreSQL shell"
        echo "  clean              Remove all containers, networks, and volumes"
        echo "  status, ps         Show service status"
        echo "  seed [--clear-existing|--force|--drop-schema]"
        echo "                     Seed database with comprehensive data"
        echo "                     Options: --clear-existing, --force, --drop-schema"
        echo "  seed-minimal       Seed database with minimal data"
        echo "  seed-force         Force seed (clears existing data first)"
        echo "  migrate            Run database migrations"
        echo "  help               Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./docker.sh start              # Start all services"
        echo "  ./docker.sh logs backend      # Show backend logs"
        echo "  ./docker.sh shell frontend    # Open shell in frontend container"
        ;;
    
    *)
        print_error "Unknown command: ${1:-}"
        echo ""
        echo "Run './docker.sh help' for usage information."
        exit 1
        ;;
esac

