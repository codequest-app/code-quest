FROM node:22-alpine AS base
RUN apk add --no-cache git
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate
WORKDIR /app

# --- deps ---
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY apps/summoner/package.json apps/summoner/
COPY packages/shared/package.json packages/shared/
COPY packages/db-schema/package.json packages/db-schema/
RUN pnpm install --frozen-lockfile --ignore-scripts

# --- web build ---
FROM deps AS web-build
COPY packages/shared/ packages/shared/
COPY packages/db-schema/ packages/db-schema/
COPY apps/web/ apps/web/
RUN pnpm --filter @code-quest/web exec tsc -p tsconfig.build.json \
 && pnpm --filter @code-quest/web exec vite build

# --- server build (tsup bundles workspace deps) ---
FROM deps AS server-build
COPY packages/shared/ packages/shared/
COPY packages/db-schema/ packages/db-schema/
COPY apps/server/ apps/server/
COPY apps/summoner/src/ apps/summoner/src/
RUN pnpm --filter @code-quest/server build

# --- prod deps (native modules compiled here, not in final image) ---
FROM node:22-alpine AS prod-deps
RUN apk add --no-cache jq python3 make g++
WORKDIR /app

COPY --from=server-build /app/apps/server/package.json ./package.json

RUN jq 'del(.dependencies["@code-quest/shared"], .dependencies["@code-quest/db-schema"], .dependencies["@code-quest/summoner"])' package.json > package.tmp.json \
 && mv package.tmp.json package.json \
 && npm install --omit=dev

# --- production (clean, no build tools) ---
FROM node:22-alpine AS production
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=server-build /app/apps/server/dist ./dist
COPY --from=web-build /app/apps/web/dist ./public

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/bin/server.js"]
