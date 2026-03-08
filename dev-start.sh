#!/bin/bash

# Start both ML model and backend services for ReturnClip

set -e

echo ""
echo "========================================"
echo "ReturnClip Development Services Startup"
echo "========================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 not found. Please install Python 3.9+"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js"
    exit 1
fi

echo "Starting Backend (http://localhost:3001)..."
echo "Starting ML Model (http://localhost:5000)..."
echo ""

cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Install concurrently if not present
npm list concurrently &>/dev/null || npm install --save-dev concurrently

# Set up ML model venv if needed
if [ ! -d "../hackcanada-model/venv" ]; then
    echo "Setting up ML model environment..."
    cd ../hackcanada-model
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ../backend
fi

echo ""
echo "Services starting... Press Ctrl+C to stop all services"
echo ""

# Start both services
npm run dev:all
