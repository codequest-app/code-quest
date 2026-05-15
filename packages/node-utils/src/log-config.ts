import type { LogLevel } from '@code-quest/schemas';

export interface LogConfig {
  level: LogLevel;
  pretty: boolean;
}

const VALID_LEVELS: Set<string> = new Set<LogLevel>([
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
]);

export function parseLogConfig(env: Record<string, string | undefined>): LogConfig {
  const rawLevel = env.LOG_LEVEL?.trim().toLowerCase();
  const level = (rawLevel && VALID_LEVELS.has(rawLevel) ? rawLevel : 'info') as LogLevel;
  const rawPretty = env.LOG_PRETTY?.trim();
  const pretty = rawPretty === 'true' || rawPretty === '1';
  return { level, pretty };
}
