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
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# --- web build ---
FROM deps AS web-build
COPY packages/shared/ packages/shared/
COPY packages/db-schema/ packages/db-schema/
COPY apps/web/ apps/web/
RUN pnpm --filter @code-quest/web exec tsc -p tsconfig.build.json \
 && pnpm --filter @code-quest/web exec vite build --outDir dist

# --- server build (tsup bundles workspace deps, npm install in dist) ---
FROM deps AS server-build
RUN apk add --no-cache python3 make g++
ARG BUILD_TARGET=build
ARG BUILD_SOURCEMAP=false
COPY packages/shared/ packages/shared/
COPY packages/db-schema/ packages/db-schema/
COPY apps/server/ apps/server/
COPY apps/summoner/src/ apps/summoner/src/
RUN --mount=type=cache,id=npm,target=/root/.npm \
    BUILD_SOURCEMAP=$BUILD_SOURCEMAP pnpm --filter @code-quest/server $BUILD_TARGET

# --- production (clean, no build tools) ---
FROM node:22-alpine AS production
WORKDIR /app

COPY --from=server-build /app/apps/server/dist ./
COPY --from=web-build /app/apps/web/dist ./public

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "bin/server.js"]
