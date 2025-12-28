#!/bin/bash

# Monster Men90 Platform Startup Script
echo "🚀 MONSTER MEN90 E-COMMERCE PLATFORM"
echo "====================================="
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Please install Node.js first."
    echo "📥 Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found! Please install npm."
    exit 1
fi

echo "✅ npm found: $(npm --version)"
echo

# Check dependencies
echo "📦 Checking dependencies..."
if [ ! -d "MonsterBackend/node_modules" ]; then
    echo "⚠️ Backend dependencies not found. Installing..."
    cd MonsterBackend && npm install && cd ..
fi

if [ ! -d "MonsterFrontend/node_modules" ]; then
    echo "⚠️ Frontend dependencies not found. Installing..."
    cd MonsterFrontend && npm install && cd ..
fi

echo "✅ Dependencies checked"
echo

# Function to kill background processes on script exit
cleanup() {
    echo
    echo "🛑 Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

echo "🌐 Starting Backend Server..."
echo "Backend will run on: http://localhost:3001"
cd MonsterBackend && npm start &
BACKEND_PID=$!
cd ..

echo "⏳ Waiting 5 seconds for backend to start..."
sleep 5

echo "🎨 Starting Frontend Development Server..."
echo "Frontend will run on: http://localhost:5173"
cd MonsterFrontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo
echo "🎉 Platform is starting up!"
echo
echo "📊 Server Status:"
echo "   • Backend:  http://localhost:3001"
echo "   • Frontend: http://localhost:5173"
echo "   • Admin Panel: http://localhost:5173/admin/login"
echo
echo "🔧 Quick Commands:"
echo "   • Backend Health: http://localhost:3001/api/health"
echo "   • API Endpoints: http://localhost:3001/api/products"
echo
echo "⚠️ Press Ctrl+C to stop all servers"
echo

# Wait for background processes
wait