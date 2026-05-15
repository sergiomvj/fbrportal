# ============================================================
# Stage 1: base — imagem base com Node + npm configurado
# ============================================================
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instala turbo globalmente para orquestrar o monorepo
RUN npm install -g turbo@2

# ============================================================
# Stage 2: pruner — usa turbo prune para isolar apenas o
#           workspace @fbr/portal e suas dependências internas
# ============================================================
FROM base AS pruner
COPY . .
RUN turbo prune @fbr/portal --docker

# ============================================================
# Stage 3: installer — instala dependências e faz o build
# ============================================================
FROM base AS installer

# 1. Copia apenas os package.json isolados (sem node_modules)
COPY --from=pruner /app/out/json/ .

# 2. Instala todas as dependências
RUN npm ci

# 3. Copia o código-fonte completo (filtrado pelo prune)
COPY --from=pruner /app/out/full/ .

# 4. Build com Turborepo — respeita a ordem de dependências
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN turbo build --filter=@fbr/portal

# ============================================================
# Stage 4: runner — imagem final mínima de produção
# ============================================================
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Cria usuário não-root por segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia os artefatos de build do Next.js (standalone mode)
COPY --from=installer --chown=nextjs:nodejs /app/apps/portal/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/portal/.next/static ./apps/portal/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/portal/server.js"]
