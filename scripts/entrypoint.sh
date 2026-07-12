#!/bin/sh
set -e

echo "Running Prisma migrations..."
# pnpm exec prisma migrate deploy
pnpm dlx prisma migrate deploy

echo "Generating Prisma client..."
# pnpm exec prisma generate
pnpm dlx prisma generate

echo "Starting application..."
# exec node dist/app.js
# pnpm dev
pnpm start