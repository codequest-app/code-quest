---
name: env-config
description: Environment variable access conventions. All env access goes through centralized config modules (packages/server/src/config.ts, packages/client/src/config.ts). Use when reading process.env, adding new env vars, or modifying config files.
---

# Environment Variable Configuration

## Convention

All env access MUST go through centralized config modules — never read `process.env` or `import.meta.env` directly in application code.

| Package | Config file | Access method |
|---------|------------|---------------|
| server | `packages/server/src/config.ts` | `process.env` with defaults |
| client | `packages/client/src/config.ts` | `import.meta.env` (Vite) |

## Server Config (`packages/server/src/config.ts`)

```ts
export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL,
  rawStore: {
    drivers: parseRawStoreDrivers(process.env.RAW_STORE ?? ''),
    sqlitePath: process.env.RAW_STORE_SQLITE_PATH ?? './data/code-quest.db',
    fileDir: process.env.RAW_STORE_FILE_DIR ?? './data/events',
  },
  systemPrompt: process.env.SYSTEM_PROMPT ?? '',
  allowDangerouslySkipPermissions: process.env.ALLOW_DANGEROUSLY_SKIP_PERMISSIONS !== 'false',
};
```

**Env loading**: Node.js 20+ native `--env-file` flag (no dotenv dependency).
```json
"dev": "tsx watch --env-file=.env src/bin/server.ts"
```

## Client Config (`packages/client/src/config.ts`)

```ts
export const config = {
  serverUrl: (import.meta.env.VITE_SERVER_URL as string) || '',
};
```

Vite auto-loads `.env` files. Only `VITE_` prefixed vars are exposed to client.

## .env Files

| File | Location |
|------|----------|
| Server | `packages/server/.env` |
| Server example | `packages/server/.env.example` |
| Client | `packages/client/.env` |
| Client example | `packages/client/.env.example` |

## Adding a New Env Var

1. Add to the appropriate config module (`config.ts`) with a sensible default
2. Add to `.env.example` with a comment
3. If server-side, no prefix needed. If client-side, use `VITE_` prefix
4. No zod validation currently — just raw access with defaults
5. Import `config` in application code, never access env directly

## Notes

- `parseRawStoreDrivers()` parses comma-separated driver list (e.g., `'sqlite,mysql,file'`)
- `allowDangerouslySkipPermissions` defaults to `true` (only `'false'` disables it)
- Dev proxy configured in `packages/client/vite.config.ts` using `process.env.PORT`
- Test: `packages/server/src/__tests__/config.test.ts` (covers `parseRawStoreDrivers`)
