# ============================================================
# Dockerfile — بيتي (Multi-stage build)
# Stage 1: deps — تثبيت الحزم
# Stage 2: builder — بناء التطبيق
# Stage 3: runner — صورة الإنتاج النهائية
# ============================================================

# ---------- Stage 1: deps ----------
FROM node:22-alpine AS deps
WORKDIR /app

# نسخ ملفات الحزم فقط أولاً (Docker layer caching)
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && \
    npx prisma generate

# ---------- Stage 2: builder ----------
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma

# بناء التطبيق
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ---------- Stage 3: runner ----------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# مستخدم غير-root للأمان
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# نسخ ملفات البناء فقط
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
