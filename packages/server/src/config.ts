import 'dotenv/config';

/** Parse env var as boolean. Accepts 'true'/'1' as true, 'false'/'0' as false. */
export function envBool(key: string, defaultValue = false, raw?: string): boolean {
  const v = raw ?? process.env[key];
  if (v === undefined) return defaultValue;
  if (v === 'true' || v === '1') return true;
  if (v === 'false' || v === '0') return false;
  return false;
}

const VALID_RAW_STORE_DRIVERS = ['sqlite', 'mysql', 'file'] as const;
export type RawStoreDriver = (typeof VALID_RAW_STORE_DRIVERS)[number];

export function parseRawStoreDrivers(raw: string): RawStoreDriver[] {
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const valid: RawStoreDriver[] = [];
  for (const part of parts) {
    if (VALID_RAW_STORE_DRIVERS.includes(part as RawStoreDriver)) {
      valid.push(part as RawStoreDriver);
    } else {
      console.warn(
        `Unknown RAW_STORE driver "${part}" — ignored. Valid: ${VALID_RAW_STORE_DRIVERS.join(', ')}`,
      );
    }
  }
  return valid;
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
} as const;
