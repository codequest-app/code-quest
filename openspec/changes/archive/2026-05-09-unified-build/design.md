## Context

目前 server build 流程：`pnpm clean && tsup && tsx obfuscate.ts`

tsup onSuccess 已經做了：
1. 複製 migrations 到 dist/
2. 產出精簡 package.json（移除 workspace deps）
3. 在 dist/ 裡 `npm install --omit=dev`（含 better-sqlite3 native addon）

所以 `server/dist` 已經是自包含的，只差 web assets 和 build profile 控制。

Dockerfile 的 `prod-deps` stage 重複做了 install，可以移除。

## Goals / Non-Goals

**Goals:**
- Vite build 直接輸出到 `server/dist/public`（本地）
- `build` vs `build:release` 控制 obfuscate，env var 控制 sourcemap
- 移除 Dockerfile 多餘的 prod-deps stage
- Root package.json 加 build scripts
- GitHub Actions per-platform release zip
- deploy.yml 移除 docker cp

**Non-Goals:**
- 不改 server.ts 的 publicDir fallback 邏輯
- 不改 dev 模式（web 仍走 vite dev server + proxy）
- 不把 build 產出搬到 root dist
- 不做 Node SEA / bun compile 單檔打包

## Decisions

### 1. Vite outDir（本地 build）

```ts
// apps/web/vite.config.ts
build: {
  outDir: '../server/dist/public',
  emptyOutDir: true,
}
```

### 2. Build Profile — build vs build:release

Server package.json:
```json
"build": "pnpm clean && tsup",
"build:release": "pnpm build && tsx obfuscate.ts"
```

Root package.json:
```json
"build": "pnpm --filter summoner build && pnpm --filter server build && pnpm --filter web build",
"build:release": "pnpm --filter summoner build && pnpm --filter server build:release && pnpm --filter web build"
```

Sourcemap 用環境變數（tsup.config.ts）：
```ts
sourcemap: process.env.BUILD_SOURCEMAP === 'true',
```

### 3. Docker — 平行 build + 合併，移除 prod-deps

```dockerfile
FROM base AS deps
RUN pnpm install --frozen-lockfile --ignore-scripts

# 平行 build
FROM deps AS web-build
COPY ...
RUN pnpm --filter web exec tsc && pnpm --filter web exec vite build

FROM deps AS server-build
ARG BUILD_TARGET=build
ARG BUILD_SOURCEMAP=false
COPY ...
RUN BUILD_SOURCEMAP=$BUILD_SOURCEMAP pnpm --filter server $BUILD_TARGET

# 最終 image — 不需要 prod-deps stage
FROM node:22-alpine AS production
WORKDIR /app
COPY --from=server-build /app/apps/server/dist ./dist
COPY --from=web-build /app/apps/web/dist ./dist/public
CMD ["node", "dist/bin/server.js"]
```

**移除 prod-deps stage** — tsup onSuccess 的 `npm install` 已經在 `dist/` 裡裝好 production deps。

**移除 PUBLIC_DIR** — server fallback `../public` 自動對應 `dist/public`。

Docker 使用：
```bash
docker build .                                          # debug
docker build --build-arg BUILD_TARGET=build:release .   # release (obfuscated)
docker build --build-arg BUILD_SOURCEMAP=true .         # with sourcemap
```

### 4. deploy.yml 簡化

移除 `docker cp` 行 — web assets 已在 server image 的 `dist/public` 裡，Caddy 改為純 reverse proxy。

### 5. GitHub Actions — per-platform release

```yaml
# .github/workflows/release.yml
strategy:
  matrix:
    include:
      - os: ubuntu-latest
        platform: linux-x64
      - os: ubuntu-24.04-arm
        platform: linux-arm64
      - os: macos-latest
        platform: darwin-arm64
      - os: windows-latest
        platform: windows-x64
```

每個 runner 上：
1. `pnpm install` — better-sqlite3 自動下載該平台 prebuilt binary
2. `pnpm build:release` — tsup + obfuscate + npm install in dist
3. `pnpm --filter web build` — vite 輸出到 server/dist/public（本地模式）
4. 複製 summoner compiled binary 到 dist 旁
5. 打包 zip 上傳 GitHub Release

Release zip 結構：
```
code-quest-{platform}.zip
├── server/
│   ├── bin/server.js        ← 加密
│   ├── migrations/
│   ├── public/              ← web assets
│   ├── package.json
│   └── node_modules/        ← platform prebuilt native modules
└── summoner[.exe]           ← bun compiled binary
```

**Why per-platform**: better-sqlite3 有 native `.node` addon，必須對應目標平台。Node 22 LTS 有 prebuilt binary，不需要編譯工具。

## Risks / Trade-offs

- **[Risk] Docker 內 web outDir 與本地不同** → Docker 用 COPY 合併，本地用 vite outDir 直輸。結果一致，機制不同。Docker 需要平行 build 效能
- **[Risk] tsup onSuccess npm install 在 Docker 內編譯 native modules** → 這正是我們要的（保證 Linux 平台一致）
- **[Risk] ubuntu-24.04-arm runner 可用性** → GitHub ARM runners 可能需要付費或等候。可先跳過 linux-arm64，有需要再加
- **[Trade-off] Release zip 含 node_modules** → 檔案較大，但使用者解壓即用，不需要安裝工具
- **[Trade-off] 移除 prod-deps stage** → 少一層 Docker cache，但原本 prod-deps 跟 server-build 串行，沒有 cache 效益
