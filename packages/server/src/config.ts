import os from 'node:os';
import 'dotenv/config';

/** Parse env var as boolean. Accepts 'true'/'1' as true, 'false'/'0' as false. */
export function envBool(key: string, defaultValue = false, raw?: string): boolean {
  const v = raw ?? process.env[key];
  if (v === undefined) return defaultValue;
  return v === 'true' || v === '1';
}

const VALID_RAW_STORE_DRIVERS = ['sqlite', 'mysql', 'file'] as const;
export type RawStoreDriver = (typeof VALID_RAW_STORE_DRIVERS)[number];

function isRawStoreDriver(s: string): s is RawStoreDriver {
  return (VALID_RAW_STORE_DRIVERS as readonly string[]).includes(s);
}

export function parseRawStoreDrivers(raw: string): RawStoreDriver[] {
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const valid: RawStoreDriver[] = [];
  for (const part of parts) {
    if (isRawStoreDriver(part)) {
      valid.push(part);
    } else {
      console.warn(
        `Unknown RAW_STORE driver "${part}" — ignored. Valid: ${VALID_RAW_STORE_DRIVERS.join(', ')}`,
      );
    }
  }
  return valid;
}

function parseExplorerRoots(raw?: string): string[] {
  if (!raw) return [os.homedir()];
  const roots = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return roots.length > 0 ? roots : [os.homedir()];
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL,
  rawStore: {
    drivers: parseRawStoreDrivers(process.env.RAW_STORE ?? ''),
    sqlitePath: process.env.RAW_STORE_SQLITE_PATH ?? './data/code-quest.db',
    fileDir: process.env.RAW_STORE_FILE_DIR ?? './data/events',
  },
  systemPrompt: process.env.SYSTEM_PROMPT ?? '',
  allowDangerouslySkipPermissions: envBool('ALLOW_DANGEROUSLY_SKIP_PERMISSIONS', true),
  explorerRoots: parseExplorerRoots(process.env.FILE_EXPLORER_ROOTS),
} as const;
