#!/bin/bash

# Exit on any error
set -e

echo "Starting FlyNext initialization..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Run Prisma migrations
echo "Running database migrations..."
#npx prisma migrate dev --name init
npx prisma generate
npx prisma migrate deploy

# Run the initialization script to fetch data from AFS
echo "Fetching data from Advanced Flights System..."
node scripts/initialize-afs-data.js

# Ensure the script has proper permissions
chmod +x run.sh

echo "FlyNext initialization completed successfully!"
