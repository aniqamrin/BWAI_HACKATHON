#!/bin/bash
# EcosystemOS AI - Local Setup Script
set -e

echo "🚀 Setting up EcosystemOS AI Platform..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required. Install from https://nodejs.org"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required. Install from https://docker.com"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required."; exit 1; }

# Copy env file
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created .env from .env.example"
  echo "⚠️  Edit .env and add your GEMINI_API_KEY before running"
else
  echo "✅ .env already exists"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start with Docker:"
echo "  docker-compose up --build"
echo ""
echo "To start locally:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Demo credentials:"
echo "  Admin:   admin@ecosystemos.ai / Password123!"
echo "  Startup: sarah@techstartup.co.ke / Password123!"
echo "  Mentor:  mchen@mentor.com / Password123!"
