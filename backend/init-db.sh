#!/bin/bash
# Database initialization script

# Don't use set -e here because we need to check exit codes explicitly
set +e

echo "🔄 Waiting for database to be ready..."

# Wait for database to be ready (check if we can connect)
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if python -c "
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@db:5432/coopcompass')
try:
    engine = create_engine(database_url)
    with engine.connect() as conn:
        conn.execute(text('SELECT 1'))
    exit(0)
except Exception:
    exit(1)
" 2>/dev/null; then
        echo "✅ Database is ready!"
        break
    fi
    attempt=$((attempt + 1))
    echo "⏳ Database is unavailable - sleeping (attempt $attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Database connection failed after $max_attempts attempts"
    exit 1
fi

# Create tables first (if they don't exist)
echo "📋 Ensuring database tables are created..."
python -c "
import os
from sqlalchemy import create_engine
from dotenv import load_dotenv
from app.models import Base

load_dotenv()
database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@db:5432/coopcompass')
engine = create_engine(database_url)

# Create all tables if they don't exist
try:
    Base.metadata.create_all(bind=engine)
    print('✅ Database tables created/verified')
except Exception as e:
    print(f'⚠️  Error creating tables: {e}')
" 2>&1

# Check if database needs seeding
echo "🌱 Checking if database needs seeding..."

# Try to count users (if any exist, assume seeded)
python -c "
import os
import sys
from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv

load_dotenv()
database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@db:5432/coopcompass')
engine = create_engine(database_url)

try:
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    # If no tables exist, we need to seed
    if not tables or 'users' not in tables:
        print('No tables found or users table missing', file=sys.stderr)
        sys.exit(1)
    
    # Check if users table has data
    with engine.connect() as conn:
        result = conn.execute(text('SELECT COUNT(*) FROM users'))
        count = result.scalar()
        if count == 0:
            print('Users table is empty', file=sys.stderr)
            sys.exit(1)  # Need to seed
        else:
            print(f'Found {count} users in database', file=sys.stderr)
            sys.exit(0)  # Already seeded
except Exception as e:
    print(f'Database check error: {e}', file=sys.stderr)
    sys.exit(1)  # Error or not initialized, need to seed
" 2>&1

seed_needed=$?

if [ $seed_needed -eq 1 ]; then
    echo "📊 Database is empty, running seed_data.py..."
    
    # Build command with optional flags from environment variables
    SEED_ARGS="--clear-existing"  # Always clear existing data when seeding empty database
    
    # Override with environment variables if set
    if [ "${DROP_SCHEMA:-false}" = "true" ]; then
        SEED_ARGS="--drop-schema"
    elif [ "${FORCE_SEED:-false}" = "true" ]; then
        SEED_ARGS="--force"
    fi
    
    echo "Running: python seed_data.py $SEED_ARGS"
    # Run seed script - ensure output is visible and unbuffered
    cd /app || exit 1
    # Force unbuffered output and ensure all output is visible
    export PYTHONUNBUFFERED=1
    python seed_data.py $SEED_ARGS
    
    seed_exit_code=$?
    if [ $seed_exit_code -eq 0 ]; then
        echo "✅ Database seeded successfully!"
    else
        echo "❌ Database seeding failed with exit code: $seed_exit_code"
        exit 1
    fi
else
    echo "✅ Database already contains data, skipping seed."
    echo "   Use --clear-existing or set CLEAR_EXISTING_DATA=true to reseed."
fi

