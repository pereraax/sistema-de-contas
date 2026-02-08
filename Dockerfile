# Dockerfile para Railway / Docker
# Next.js + Node custom server

FROM node:20-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat

# Dependências
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Supabase - necessários no build para NEXT_PUBLIC_* serem incluídos no bundle
ARG NEXT_PUBLIC_SUPABASE_URL=https://frhxqgcqmxpjpnghsvoe.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyaHhxZ2NxbXhwanBuZ2hzdm9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTM3NTYsImV4cCI6MjA3OTIyOTc1Nn0.p1OxLRA5DKgvetuy-IbCfYClNSjrvK6fm43aZNX3T7I
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
RUN npm run build
# Horário do build para verificar qual deploy está no ar (api/build-info)
RUN date -u +%Y-%m-%dT%H:%M:%SZ > /app/build-time.txt

# Produção
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/build-time.txt ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/server.js ./
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/app ./app
COPY --from=builder /app/components ./components
COPY --from=builder /app/middleware.ts ./
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/TEMPLATE-EMAIL-RESET-SENHA.html ./

# Criar diretório de cache e dar permissão ao usuário nextjs
RUN mkdir -p /app/.next/cache && chown -R nextjs:nodejs /app/.next

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
