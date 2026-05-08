import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { parseFsRoots, type ThinkingDisplay } from '@code-quest/shared';
import { type LogConfig, parseLogConfig } from '@code-quest/shared/node';

type Env = Record<string, string | undefined>;

/** Accepts `'true'` / `'1'` as true; anything else (including undefined) → defaultValue. */
export function parseBool(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw === undefined) return defaultValue;
  return raw === 'true' || raw === '1';
}

function parseNumber(raw: string | undefined, defaultValue: number): number {
  const n = parseInt(raw ?? '', 10);
  return Number.isNaN(n) ? defaultValue : n;
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

const DEFAULT_SQLITE_URL = 'file:./data/code-quest.db';

/** Default ws-only; falls back to ws on unrecognized values. */
function parseTransport(raw: string | undefined): { ws: boolean; socketio: boolean } {
  switch (raw) {
    case 'socketio':
      return { ws: false, socketio: true };
    case 'both':
      return { ws: true, socketio: true };
    default:
      return { ws: true, socketio: false };
  }
}

interface AppConfig {
  readonly port: number;
  readonly database: {
    readonly url: string;
    readonly sqliteUrl: string;
  };
  readonly rawEvents: {
    readonly writeDeltas: boolean;
    readonly readDeltas: boolean;
  };
  readonly systemPrompt: string;
  readonly allowDangerouslySkipPermissions: boolean;
  readonly thinkingDisplay: ThinkingDisplay;
  readonly fsRoots: string[];
  readonly autoMode: boolean;
  readonly transport: { readonly ws: boolean; readonly socketio: boolean };
  readonly historyBatchSize: number;
  readonly log: LogConfig;
  readonly summonerMode: 'local' | 'remote';
  readonly summonerToken: string | undefined;
  readonly summonerTokenGenerated: boolean;
}

export function loadConfig(env: Env = process.env): AppConfig {
  return {
    port: parseNumber(env.APP_PORT, 3000),
    database: resolveDatabase(env),
    rawEvents: {
      writeDeltas: parseBool(env.RAW_EVENTS_WRITE_DELTAS, false),
      readDeltas: parseBool(env.RAW_EVENTS_READ_DELTAS, false),
    },
    systemPrompt: env.CLI_SYSTEM_PROMPT ?? '',
    allowDangerouslySkipPermissions: parseBool(env.CLI_BYPASS_PERMISSIONS, true),
    thinkingDisplay: parseThinkingDisplay(env.CLI_THINKING_DISPLAY),
    fsRoots: parseFsRoots(env.EXPLORER_ROOTS),
    autoMode: parseBool(env.CLI_AUTO_MODE, true),
    transport: parseTransport(env.TRANSPORT),
    log: parseLogConfig(env),
    historyBatchSize: parseNumber(env.SESSION_HISTORY_BATCH_SIZE, 5000),
    summonerMode: env.SUMMONER_MODE === 'local' ? 'local' : 'remote',
    ...resolveSummonerToken(env),
  } as const;
}

function resolveDatabase(env: Env): { url: string; sqliteUrl: string } {
  const sqliteUrl = env.DATABASE_SQLITE_URL || DEFAULT_SQLITE_URL;
  const url = env.DATABASE_URL || sqliteUrl;
  return { url, sqliteUrl };
}

function resolveSummonerToken(env: Env): {
  summonerToken: string | undefined;
  summonerTokenGenerated: boolean;
} {
  if (env.SUMMONER_MODE === 'local')
    return { summonerToken: undefined, summonerTokenGenerated: false };
  if (env.SUMMONER_TOKEN)
    return { summonerToken: env.SUMMONER_TOKEN, summonerTokenGenerated: false };
  return { summonerToken: randomUUID(), summonerTokenGenerated: true };
}

export const config: AppConfig = loadConfig();
