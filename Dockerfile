FROM node:24-alpine

RUN apk add --no-cache openssl libc6-compat curl ca-certificates

WORKDIR /app

RUN npm install -g pnpm

COPY package.json package-lock.json ./

RUN pnpm install

COPY . .

# RUN pnpm exec prisma migrate deploy
RUN pnpm exec prisma generate

ARG PORT=8080

EXPOSE $PORT

ENV NODE_ENV=production

ENV PORT=$PORT

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm start"]
# CMD ["sh", "-c", "pnpm start"]
# Note: Prisma Migrate is commented out to prevent accidental schema changes in prod.