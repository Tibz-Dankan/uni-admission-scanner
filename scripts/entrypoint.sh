#!/bin/sh
set -e

echo "Running Drizzle migrations..."
pnpm exec drizzle-kit migrate

echo "Starting application..."
pnpm start