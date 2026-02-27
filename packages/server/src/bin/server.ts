import 'reflect-metadata';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import type { ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
import type { ProcessFactory } from '@code-quest/summoner';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { createContainer, type StoreConfig } from '../container.ts';
import { createMysqlDatabase } from '../db/mysql-client.ts';
import type { ChatHandler } from '../socket/chat-handler.ts';
import { TYPES } from '../types.ts';

const PORT = Number(process.env.PORT ?? 3001);

const processFactory: ProcessFactory = (command, args, options) => spawn(command, args, options);

const sqlitePath = process.env.DB_SQLITE_PATH ?? './data/code-quest.db';

const storeConfig: StoreConfig = { sqlite: true };

if (process.env.DATABASE_URL) {
  storeConfig.mysql = { database: createMysqlDatabase(process.env.DATABASE_URL) };
}

if (process.env.RAW_EVENT_DIR) {
  storeConfig.file = { dir: process.env.RAW_EVENT_DIR };
}

const container = createContainer({
  processFactory,
  dbPath: sqlitePath,
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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status = err instanceof Error && 'status' in err ? (err as { status: number }).status : 500;
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  res.status(status).json({ error: message });
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

const shutdown = () => {
  console.log('Shutting down gracefully...');
  io.close();
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
