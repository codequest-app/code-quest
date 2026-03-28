const VALID_RAW_STORE_DRIVERS = ['sqlite', 'mysql', 'file'] as const;
export type RawStoreDriver = (typeof VALID_RAW_STORE_DRIVERS)[number];

export function parseRawStoreDrivers(raw: string): RawStoreDriver[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is RawStoreDriver => VALID_RAW_STORE_DRIVERS.includes(s as RawStoreDriver));
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
  allowDangerouslySkipPermissions: process.env.ALLOW_DANGEROUSLY_SKIP_PERMISSIONS !== 'false',
} as const;
