#!/bin/bash

# Compass Backend - Force Restart Script

echo "🔄 Restarting Compass Backend with CORS fix..."
echo ""

# Find and kill any running uvicorn processes on port 8000
echo "Stopping any existing backend processes..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
pkill -f "uvicorn app.main:app" 2>/dev/null || true

sleep 2

# Navigate to backend directory
cd "$(dirname "$0")"

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    echo "✅ Virtual environment activated"
else
    echo "⚠️  Virtual environment not found at venv/bin/activate"
    echo "Please activate it manually before running this script"
    exit 1
fi

# Start backend with reload
echo ""
echo "🚀 Starting backend with CORS enabled..."
echo "Backend will be available at: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "CORS is configured for:"
echo "  - http://localhost:5173 (Vite frontend)"
echo "  - http://localhost:3000 (Alternative frontend)"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000



