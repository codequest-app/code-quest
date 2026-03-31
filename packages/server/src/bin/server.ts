import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import type { ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
import { ChildProcessProvider } from '@code-quest/summoner';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { config } from '../config.ts';
import { createContainer, type StoreConfig } from '../container.ts';
import { createMysqlDatabase } from '../db/mysql-client.ts';
import { logger } from '../logger.ts';
import { createProfileRouter } from '../routes/profile.ts';
import { createSessionsRouter } from '../routes/sessions.ts';
import { createUsageRouter } from '../routes/usage.ts';
import type { RawEventStore } from '../services/raw-event-store.ts';
import type { SessionStore } from '../services/session-store.ts';
import type { UsageTracker } from '../services/usage-tracker.ts';
import type { ChatHandler } from '../socket/chat-handler.ts';
import { TYPES } from '../types.ts';

const storeConfig: StoreConfig = {};

if (config.rawStore.drivers.includes('sqlite')) {
  storeConfig.sqlite = true;
}

if (config.rawStore.drivers.includes('mysql') && config.databaseUrl) {
  storeConfig.mysql = { database: createMysqlDatabase(config.databaseUrl) };
}

if (config.rawStore.drivers.includes('file')) {
  storeConfig.file = { dir: config.rawStore.fileDir };
}

const container = createContainer({
  processProvider: new ChildProcessProvider(),
  dbPath: config.rawStore.sqlitePath,
  storeConfig,
});

const app = express();
app.use(helmet());
app.use(cors());

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: '*' },
});

const chatHandler = container.get<ChatHandler>(TYPES.ChatHandler);
chatHandler.register(io);

const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
const rawEventStore = container.get<RawEventStore>(TYPES.RawEventStore);
const usageTracker = container.get<UsageTracker>(TYPES.UsageTracker);
app.use(createSessionsRouter(sessionStore, rawEventStore));
app.use(createUsageRouter(usageTracker));
app.use(createProfileRouter(() => ({ authenticated: false })));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const clientDist = join(import.meta.dirname, '../../..', 'client/dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/health')) return next();
    res.sendFile(join(clientDist, 'index.html'));
  });
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status =
    err instanceof Error &&
    'status' in err &&
    typeof (err as Record<string, unknown>).status === 'number'
      ? ((err as Record<string, unknown>).status as number)
      : 500;
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  if (status >= 500) logger.error({ err, status }, 'Unhandled request error');
  res.status(status).json({ error: message });
});

httpServer.listen(config.port, () => {
  logger.info({ port: config.port }, 'Server listening');
});

const shutdown = () => {
  logger.info('Shutting down gracefully...');
  io.close();
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
