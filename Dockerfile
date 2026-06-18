FROM node:24-alpine

RUN apk add --no-cache openssl libc6-compat curl ca-certificates

WORKDIR /app

RUN npm install -g pnpm

COPY server/package.json server/pnpm-lock.yaml server/pnpm-workspace.yaml server/.npmrc ./

RUN pnpm install

COPY server/ .

# RUN pnpm exec prisma migrate deploy
# RUN pnpm exec prisma generate

ARG PORT=8081

EXPOSE 8081

ENV NODE_ENV=production

ENV PORT=8081

CMD ["sh", "-c", "pnpm exec prisma generate && pnpm exec prisma migrate deploy && pnpm start"]
# CMD ["sh", "-c", "pnpm start"]
# Note: Prisma Migrate is commented out to prevent accidental schema changes in prod.