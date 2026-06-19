#!/usr/bin/env bash
set -euo pipefail

pnpm exec prisma migrate deploy
pnpm exec prisma generate