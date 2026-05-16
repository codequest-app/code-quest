export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

export interface Logger {
  fatal(...args: unknown[]): void;
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  info(...args: unknown[]): void;
  debug(...args: unknown[]): void;
  trace(...args: unknown[]): void;
}

export const NOOP_LOGGER: Logger = {
  fatal() {},
  error() {},
  warn() {},
  info() {},
  debug() {},
  trace() {},
};

export interface LogConfig {
  level: LogLevel;
  pretty: boolean;
}

const VALID_LEVELS = new Set<LogLevel>([
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
  const level = (
    rawLevel && VALID_LEVELS.has(rawLevel as LogLevel) ? rawLevel : 'info'
  ) as LogLevel;
  const rawPretty = env.LOG_PRETTY?.trim();
  const pretty = rawPretty === 'true' || rawPretty === '1';
  return { level, pretty };
}
