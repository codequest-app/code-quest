## Context

Summoner 使用 `build.ts` 做兩步 build：bun bundle + javascript-obfuscator → bun --compile。目前只產出本機平台的執行檔。Bun 支援 cross-compile，可從任何平台 build 所有目標。

## Goals / Non-Goals

**Goals:**
- Push to main 時自動 build 5 個平台的 summoner 執行檔
- Obfuscation 只做一次，cross-compile 做 5 次
- 產出上傳到 GitHub Releases

**Non-Goals:**
- 不做 web/server 的 CI/CD 部署（另一個 change）
- 不做 signed binary（未來再做）
- 不做 tag-based release（先 push main 觸發）

## Decisions

### 1. Build 流程拆分

```
build.ts (obfuscate)          compile.ts (cross-compile)
─────────────────────         ──────────────────────────
src/main.ts                   dist/main.js
  → bun bundle + minify         → bun build --compile --target=bun-darwin-arm64
  → javascript-obfuscator       → bun build --compile --target=bun-darwin-x64
  → dist/main.js                → bun build --compile --target=bun-linux-x64
                                 → bun build --compile --target=bun-linux-arm64
                                 → bun build --compile --target=bun-windows-x64
```

build.ts 保持只做 bundle + obfuscate。新增一個 compile step 做 cross-compile。

### 2. GitHub Actions Workflow

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'apps/summoner/**'
      - 'packages/shared/**'

jobs:
  release-summoner:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup bun
      - setup pnpm + install
      - run build.ts (bundle + obfuscate → dist/main.js)
      - cross-compile 5 targets (parallel)
      - upload to GitHub Releases (rolling latest)
```

使用 `paths` filter 只在 summoner 或 shared 有改動時觸發。

### 3. Release 策略

使用 rolling release — 每次 push main 覆蓋同一個 `latest` release tag，不建立版本號。簡單直接。

### 4. 執行檔命名

```
summoner-darwin-arm64
summoner-darwin-x64
summoner-linux-x64
summoner-linux-arm64
summoner-windows-x64.exe
```

## Risks / Trade-offs

- **[Risk] obfuscation 在 CI 上很慢** → 可接受，只在 push main 時跑
- **[Risk] rolling release 覆蓋舊版** → 先這樣，未來需要版本管理再加 semver
- **[Trade-off] ubuntu runner 做 cross-compile** → bun 支援，不需要 matrix build
