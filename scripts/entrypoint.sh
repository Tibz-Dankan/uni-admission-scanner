#!/bin/sh
set -e

echo "Baselining Drizzle migration history..."
node scripts/drizzle-mark-baseline.cjs

echo "Running Drizzle migrations..."
pnpm exec drizzle-kit migrate

echo "Starting application..."
pnpm start