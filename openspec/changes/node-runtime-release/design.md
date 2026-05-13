## Context

Currently, releasing requires GitHub Actions matrix builds across Linux, macOS, and Windows to cross-compile summoner via `bun build --compile`. This depends on GitHub-hosted runners (paid) and bundles the Node.js runtime + better-sqlite3 binary into the release artifact.

The goal is to produce platform-agnostic JS bundles from a single self-hosted runner, then let the start scripts auto-download the correct Node.js and better-sqlite3 prebuilt at first launch.

## Goals / Non-Goals

**Goals**
- Eliminate per-platform CI runners; a single runner produces all artifacts
- `summoner` bundle targets Node.js so it runs under a downloaded node binary
- Start scripts auto-detect platform and download only what is needed
- Release is published via `git push` to a release repo instead of GitHub Releases

**Non-Goals**
- Bun cross-compile (`compile.ts`) is not removed — kept as an optional advanced path
- No change to how the server Express app is built or tested

## Decisions

### 1. Summoner bundle target: `bun` → `node`

`bun build --target bun` produces a binary that embeds the Bun runtime, requiring cross-compilation per platform (Linux/macOS/Windows arm64/x64). Switching to `--target node` produces a plain JS bundle that any Node.js 22 binary can execute. This is the key enabler: CI bundles once, start scripts handle the runtime download per platform.

`compile.ts` (bun cross-compile) is retained but moved out of the default `build:release` path, exposed as a separate `compile` script for local or advanced use.

### 2. Auto-download scripts: platform detection

Each start script detects OS and arch at runtime using shell/bat primitives, then constructs the correct download URL:

**Node.js** (server + summoner):
```
https://nodejs.org/dist/v{version}/node-v{version}-{os}-{arch}.tar.gz
```
- `{os}`: `linux`, `darwin`, `win`
- `{arch}`: `x64`, `arm64` (detected via `uname -m` on Unix, `PROCESSOR_ARCHITECTURE` on Windows)

**better-sqlite3 prebuilt** (server only):
```
https://github.com/WiseLibs/better-sqlite3/releases/download/v{version}/better-sqlite3-v{version}-node-v{napi}-{os}-{arch}.tar.gz
```
- `{napi}`: `127` (fixed for Node.js 22)
- Version pinned to `12.6.2`

Downloaded artifacts are cached in a `runtime/` directory alongside the script. Subsequent launches skip the download if the binary is already present.

Scripts are split into two pairs:
- `server.sh` / `server.bat` — downloads node + better-sqlite3, starts server
- `summoner.sh` / `summoner.bat` — downloads node only, starts summoner

### 3. Release repo push replaces `release.yml`

`release.yml` is removed. CI (single self-hosted runner) builds bundles, then `git push`es to the release repo (`codequest-app/release`). The release repo contains:

```
server/
  server.sh
  server.bat
  index.js          ← bundled server
summoner/
  summoner.sh
  summoner.bat
  index.js          ← bundled summoner
```

Each subdirectory is self-contained: users download only the component they need and run the start script. The release repo HEAD always reflects the latest release; tags mark versions.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| First-launch requires internet access | Document requirement; scripts fail fast with a clear message if download fails |
| `nodejs.org` or `github.com` URL changes / rate limits | Pin exact versions; scripts exit non-zero so the failure is visible |
| NAPI version mismatch if Node.js major is bumped | NAPI version (`127` for Node 22) is a constant in the script; must be updated when Node version changes |
| Release repo grows unboundedly with binary-like artifacts | Bundles are plain JS (small); node binaries are not committed — only scripts and JS bundles are in the repo |
| `bun --target node` bundle compatibility edge cases | summoner has no exotic Bun APIs; any incompatibilities surface in CI tests before release |
