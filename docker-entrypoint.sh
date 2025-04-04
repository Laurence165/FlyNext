#!/bin/sh

set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to start..."
/app/node_modules/.bin/wait-on -t 60000 tcp:postgres:5432

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run migrations in production mode
echo "Running database migrations..."
npx prisma migrate deploy

# Seed the database if needed
if [ "$SEED_DB" = "true" ]; then
  echo "Seeding the database..."
  node prisma/seed.ts
fi

# Start the application
echo "Starting FlyNext..."
exec "$@"