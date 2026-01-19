#!/bin/bash

# TPES Frontend Startup Script

echo "🚀 Starting TPES Frontend..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    echo "VITE_API_URL=http://localhost:8000" > .env
    echo "✅ .env file created"
    echo ""
fi

echo "🌐 Starting development server..."
echo "Frontend will be available at: http://localhost:5173"
echo "Backend API should be running at: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev

