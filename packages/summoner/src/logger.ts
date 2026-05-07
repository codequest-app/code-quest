import { parseLogConfig } from '@code-quest/shared/node';
import pino from 'pino';

const logConfig = parseLogConfig(process.env);

export const logger: pino.Logger = pino({
  level: logConfig.level,
  transport: logConfig.pretty ? { target: 'pino-pretty' } : undefined,
});
