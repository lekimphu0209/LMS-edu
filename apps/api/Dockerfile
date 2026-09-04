# Backend Dockerfile — Build NestJS API
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate

# --- Install deps ---
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# --- Build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate --schema=prisma/schema.prisma
RUN pnpm --filter @educonnect/api build

# --- Production ---
FROM base AS prod
WORKDIR /app
ENV NODE_ENV=production

# Copy lockfiles and package.json for fresh install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install all deps (need prisma CLI for generate)
RUN pnpm install --frozen-lockfile

# Copy prisma schema and generate client
COPY --from=builder /app/prisma ./prisma
RUN npx prisma@6.19.3 generate --schema=prisma/schema.prisma

# Copy built output
COPY --from=builder /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/main.js"]
