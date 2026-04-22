import os from 'node:os';
import 'dotenv/config';

type Env = Record<string, string | undefined>;

/** Parse env var as boolean. Accepts 'true'/'1' as true, 'false'/'0' as false. */
export function envBool(key: string, defaultValue = false, raw?: string): boolean {
  const v = raw ?? process.env[key];
  if (v === undefined) return defaultValue;
  return v === 'true' || v === '1';
}

function parseBool(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw === undefined) return defaultValue;
  return raw === 'true' || raw === '1';
}

/** Resolve a SQLite URL to the filesystem path better-sqlite3 expects.
 *  Canonical form is `file:...` (Drizzle / Prisma convention). Bare paths
 *  are accepted so users migrating from RAW_EVENTS_SQLITE_PATH can paste
 *  their value verbatim. */
export function resolveSqlitePath(url: string): string {
  if (url === 'file::memory:') return ':memory:';
  if (url.startsWith('file:')) return url.slice(5);
  return url;
}

function parseExplorerRoots(raw?: string): string[] {
  if (!raw) return [os.homedir()];
  const roots = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return roots.length > 0 ? roots : [os.homedir()];
}

export function loadConfig(env: Env = process.env) {
  return {
    port: Number(env.APP_PORT ?? 3000),
    database: {
      url: env.DATABASE_URL || undefined,
      sqliteUrl: env.DATABASE_SQLITE_URL || undefined,
    },
    rawEvents: {
      persistDeltas: parseBool(env.RAW_EVENTS_PERSIST_DELTAS, false),
    },
    systemPrompt: env.CLI_SYSTEM_PROMPT ?? '',
    allowDangerouslySkipPermissions: parseBool(env.CLI_BYPASS_PERMISSIONS, true),
    explorerRoots: parseExplorerRoots(env.EXPLORER_ROOTS),
    autoMode: parseBool(env.CLI_AUTO_MODE, true),
  } as const;
}

export const config = loadConfig();
