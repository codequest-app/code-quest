import os from 'node:os';
import 'dotenv/config';
import type { ThinkingDisplay } from '@code-quest/shared';

type Env = Record<string, string | undefined>;

/** Accepts `'true'` / `'1'` as true; anything else (including undefined) → defaultValue. */
export function parseBool(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw === undefined) return defaultValue;
  return raw === 'true' || raw === '1';
}

/** Invalid / unset → 'summarized' (CLI-default-compat + UI expects content). */
function parseThinkingDisplay(raw: string | undefined): ThinkingDisplay {
  return raw === 'omitted' ? 'omitted' : 'summarized';
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
      writeDeltas: parseBool(env.RAW_EVENTS_WRITE_DELTAS, false),
      readDeltas: parseBool(env.RAW_EVENTS_READ_DELTAS, false),
    },
    systemPrompt: env.CLI_SYSTEM_PROMPT ?? '',
    allowDangerouslySkipPermissions: parseBool(env.CLI_BYPASS_PERMISSIONS, true),
    thinkingDisplay: parseThinkingDisplay(env.CLI_THINKING_DISPLAY),
    explorerRoots: parseExplorerRoots(env.EXPLORER_ROOTS),
    autoMode: parseBool(env.CLI_AUTO_MODE, true),
  } as const;
}

export const config = loadConfig();
