#!/bin/bash
# Reset and reseed the database (development only)
set -e

echo "⚠️  This will DROP and recreate the database schema + seed data."
read -p "Continue? (y/N): " confirm
[[ "$confirm" == "y" || "$confirm" == "Y" ]] || { echo "Aborted."; exit 0; }

cd backend

echo "🗄️  Running schema migration..."
node src/db/migrate.js

echo "🌱 Running seed data..."
node src/db/seed.js

echo "✅ Database reset complete!"
