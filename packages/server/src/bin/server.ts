import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { ChildProcessProvider } from '@code-quest/summoner';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { config, resolveSqlitePath } from '../config.ts';
import { createContainer, type StoreConfig } from '../container.ts';
import { createMysqlDatabase } from '../db/mysql-client.ts';
import { createDatabase } from '../db/sqlite-client.ts';
import { logger } from '../logger.ts';
import { createProfileRouter } from '../routes/profile.ts';
import { createSessionsRouter } from '../routes/sessions.ts';
import { createUsageRouter } from '../routes/usage.ts';
import type { RawEventStore } from '../services/raw-event-store.ts';
import type { SessionStore } from '../services/session-store.ts';
import type { UsageTracker } from '../services/usage-tracker.ts';
import { NullAuthenticator } from '../socket/authenticator.ts';
import type { SocketServer } from '../socket/server.ts';
import { SocketIoTransport } from '../socket/socket-io-transport.ts';
import type { TransportHandle } from '../socket/transport.ts';
import { WsTransport } from '../socket/ws-transport.ts';
import { TYPES } from '../types.ts';

const storeConfig: StoreConfig = {};

if (config.database.sqliteUrl) {
  storeConfig.sqliteDatabase = createDatabase(resolveSqlitePath(config.database.sqliteUrl));
}

if (config.database.url) {
  storeConfig.mysqlDatabase = createMysqlDatabase(config.database.url);
}

if (!storeConfig.sqliteDatabase && !storeConfig.mysqlDatabase) {
  throw new Error(
    'No database backend configured. Set DATABASE_URL (MySQL) and/or ' +
      'DATABASE_SQLITE_URL (e.g. file:./data/code-quest.db) in .env. ' +
      'See packages/server/.env.example for a working default.',
  );
}

if (config.rawEvents.readDeltas && !config.rawEvents.writeDeltas) {
  logger.warn(
    'RAW_EVENTS_READ_DELTAS=true but RAW_EVENTS_WRITE_DELTAS=false — ' +
      'no deltas will ever be persisted, so UNION reads an empty table. ' +
      'Did you mean to set both?',
  );
}

const container = createContainer({
  processProvider: new ChildProcessProvider(),
  storeConfig,
});

const app = express();
app.use(helmet());
app.use(cors());

const httpServer = createServer(app);

// Mount transports per config. socket.io and ws are independent and can both
// run on the same http server (different paths). Default is ws-only.
const authenticator = new NullAuthenticator();
const handles: TransportHandle[] = [];
if (config.transport.socketio) {
  handles.push(new SocketIoTransport({ authenticator, cors: { origin: '*' } }).attach(httpServer));
}
if (config.transport.ws) {
  handles.push(new WsTransport({ authenticator, path: '/ws' }).attach(httpServer));
}

const socketServer = container.get<SocketServer>(TYPES.SocketServer);
for (const handle of handles) socketServer.register(handle);
logger.info(
  { ws: config.transport.ws, socketio: config.transport.socketio },
  'Transports attached',
);

const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
const rawEventService = container.get<RawEventStore>(TYPES.RawEventService);
const usageTracker = container.get<UsageTracker>(TYPES.UsageTracker);
app.use(createSessionsRouter(sessionStore, rawEventService));
app.use(createUsageRouter(usageTracker));
app.use(createProfileRouter(() => ({ authenticated: false })));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

/** Relative path from server bin to the monorepo root */
const CLIENT_DIST_RELATIVE = '../../..';
const clientDist = join(import.meta.dirname, CLIENT_DIST_RELATIVE, 'client/dist');
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
    err instanceof Error && 'status' in err && typeof err.status === 'number' ? err.status : 500;
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  if (status >= 500) logger.error({ err, status }, 'Unhandled request error');
  res.status(status).json({ error: message });
});

httpServer.listen(config.port, () => {
  logger.info({ port: config.port }, 'Server listening');
});

const shutdown = () => {
  logger.info('Shutting down gracefully...');
  Promise.all(handles.map((h) => h.close())).finally(() => {
    httpServer.close(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
