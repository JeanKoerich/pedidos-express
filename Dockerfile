# Frontend Dockerfile - Multi-stage build
FROM node:20-alpine AS base

# 1. Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# 2. Rebuild the source code
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# --- LINHA ADICIONADA PARA CORRIGIR O ERRO DO v0 ---
# Garante que o arquivo de config de usuário exista antes do build
RUN touch next.user-config.mjs
# --------------------------------------------------

ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN corepack enable pnpm && pnpm build

# 3. Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

# O Next.js em modo standalone gera um arquivo server.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Importante: No modo standalone, rodamos o server.js gerado pelo build
CMD ["node", "server.js"]