# ==========================================
# Frontend - Next.js Multistage Dockerfile
# ==========================================

# Stage 1: Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Stage 2: Build Next.js application
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_BASE_URL=""
ARG BACKEND_URL="http://backend:8000"
ARG DOCKER_BACKEND_URL="http://backend:8000"
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV BACKEND_URL=$BACKEND_URL
ENV DOCKER_BACKEND_URL=$DOCKER_BACKEND_URL
ENV DOCKER_CONTAINER=true
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 3: Lightweight Production Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DOCKER_CONTAINER=true
ENV BACKEND_URL="http://backend:8000"
ENV DOCKER_BACKEND_URL="http://backend:8000"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
    CMD wget -q -O - http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
