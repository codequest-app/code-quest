import pino from 'pino';
import { config } from './config.ts';

export const logger: pino.Logger = pino({
  level: config.log.level,
  transport: config.log.pretty ? { target: 'pino-pretty' } : undefined,
});
