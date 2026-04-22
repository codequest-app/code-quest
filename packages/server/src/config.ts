import os from 'node:os';
import 'dotenv/config';

const DRIVERS = ['sqlite', 'mysql'] as const;
export type RawEventsDriver = (typeof DRIVERS)[number];

function isDriver(s: string): s is RawEventsDriver {
  return (DRIVERS as readonly string[]).includes(s);
}

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

export function parseRawEventsDrivers(raw: string): RawEventsDriver[] {
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const valid: RawEventsDriver[] = [];
  for (const part of parts) {
    if (isDriver(part)) {
      valid.push(part);
    } else {
      console.warn(
        `Unknown RAW_EVENTS_DRIVERS value "${part}" — ignored. Valid: ${DRIVERS.join(', ')}`,
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

export function loadConfig(env: Env = process.env) {
  return {
    port: Number(env.APP_PORT ?? 3000),
    databaseUrl: env.DATABASE_URL,
    rawEvents: {
      drivers: parseRawEventsDrivers(env.RAW_EVENTS_DRIVERS ?? ''),
      sqlitePath: env.RAW_EVENTS_SQLITE_PATH ?? './data/code-quest.db',
    },
    systemPrompt: env.CLI_SYSTEM_PROMPT ?? '',
    allowDangerouslySkipPermissions: parseBool(env.CLI_BYPASS_PERMISSIONS, true),
    explorerRoots: parseExplorerRoots(env.EXPLORER_ROOTS),
    autoMode: parseBool(env.CLI_AUTO_MODE, true),
  } as const;
}

export const config = loadConfig();
