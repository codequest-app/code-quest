import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import {
  auth,
  bearerAuth,
  errMsg,
  heartbeat,
  NullAuthenticator,
  RpcChannel,
  type RpcChannelSocket,
  resumable,
  type TransportHandle,
  WsTransport,
  wsAdapter,
} from '@code-quest/shared';
import { ChildProcessProvider } from '@code-quest/summoner';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { config, resolveSqlitePath } from '../config.ts';
import { createContainer, type StoreConfig } from '../container.ts';
import { createMysqlDatabase } from '../db/mysql-client.ts';
import { createDatabase } from '../db/sqlite-client.ts';
import { logger } from '../logger.ts';
import { ReconnectableRpc } from '../remote/reconnectable-rpc.ts';
import type { ChannelEmitter } from '../socket/channel-emitter.ts';
import type { SocketServer } from '../socket/server.ts';
import { SocketIoTransport } from '../transport/socket-io-transport.ts';
import { TYPES } from '../types.ts';

const WS_PATH = '/ws';
const SUMMONER_PATH = '/summoner';

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

function requireRemoteToken(): string {
  const token = config.remoteToken;
  if (!token) throw new Error('REMOTE_TOKEN must be set when REMOTE_MODE=remote');
  return token;
}

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

const wsTransport = new WsTransport(wsAdapter(), logger);
if (config.transport.ws) {
  wsTransport.route(
    WS_PATH,
    [
      auth(authenticator),
      heartbeat({ pingIntervalMs: 25_000, idleTimeoutMs: 60_000 }),
      resumable(),
    ],
    () => {},
  );
}

function registerTransports(socketSrv: SocketServer): void {
  for (const handle of handles) socketSrv.register(handle);
  logger.info(
    { ws: config.transport.ws, socketio: config.transport.socketio },
    'Transports attached',
  );
}

let container: ReturnType<typeof createContainer> | null = null;

if (config.remoteMode === 'local') {
  container = createContainer({
    processProvider: new ChildProcessProvider(),
    storeConfig,
    fsRoots: config.fsRoots,
    rawEvents: config.rawEvents,
  });
  handles.push(wsTransport.attach(httpServer));
  registerTransports(container.get<SocketServer>(TYPES.SocketServer));
}

if (config.remoteMode === 'remote') {
  container = setupRemoteMode();
}

function setupRemoteMode() {
  const remoteToken = requireRemoteToken();
  const reconnectableRpc = new ReconnectableRpc();

  const c = createContainer({
    remoteRpc: reconnectableRpc,
    storeConfig,
    rawEvents: config.rawEvents,
  });

  wsTransport.route(
    SUMMONER_PATH,
    [bearerAuth(remoteToken), heartbeat({ pingIntervalMs: 30_000, idleTimeoutMs: 60_000 })],
    (_socket, ctx) => {
      const rpc = new RpcChannel(ctx.socket as RpcChannelSocket);
      reconnectableRpc.replace(rpc);
      broadcastRemoteStatus(c, true);

      rpc.on('disconnect', () => broadcastRemoteStatus(c, false));
    },
  );

  handles.push(wsTransport.attach(httpServer));
  registerTransports(c.get<SocketServer>(TYPES.SocketServer));
  return c;
}

function broadcastRemoteStatus(c: ReturnType<typeof createContainer>, connected: boolean) {
  logger.info(connected ? 'remote daemon connected' : 'remote daemon disconnected');
  c.get<ChannelEmitter>(TYPES.ChannelEventRouter).broadcastAll('remote:status', { connected });
}

const HEALTH_PATH = '/health';

app.get(HEALTH_PATH, (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

/** Relative path from server bin to the monorepo root */
const CLIENT_DIST_RELATIVE = '../../..';
const clientDist = join(import.meta.dirname, CLIENT_DIST_RELATIVE, 'client/dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback
  app.get('*', (req, res, next) => {
    if (req.path.startsWith(HEALTH_PATH)) return next();
    res.sendFile(join(clientDist, 'index.html'));
  });
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status =
    err instanceof Error && 'status' in err && typeof err.status === 'number' ? err.status : 500;
  const message = errMsg(err, 'Internal Server Error');
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
  const SHUTDOWN_TIMEOUT_MS = 10_000;
  setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
