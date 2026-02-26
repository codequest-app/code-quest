import 'reflect-metadata';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
import type { ProcessFactory } from '@code-quest/summoner';
import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';
import { createContainer, type StoreConfig } from '../container.ts';
import { createMysqlDatabase } from '../db/mysql-client.ts';
import type { ChatHandler } from '../socket/chat-handler.ts';
import { TYPES } from '../types.ts';

const PORT = Number(process.env.PORT ?? 3001);

const processFactory: ProcessFactory = (command, args, options) => spawn(command, args, options);

async function main() {
  const sqlitePath = process.env.DB_SQLITE_PATH ?? './data/code-quest.db';

  const storeConfig: StoreConfig = { sqlite: true };

  if (process.env.DATABASE_URL) {
    const database = await createMysqlDatabase(process.env.DATABASE_URL);
    storeConfig.mysql = { database };
  }

  if (process.env.RAW_EVENT_DIR) {
    storeConfig.file = { dir: process.env.RAW_EVENT_DIR };
  }

  const container = createContainer({
    processFactory,
    dbPath: sqlitePath,
    storeConfig,
  });

  const __dirname = dirname(fileURLToPath(import.meta.url));

  const app = express();
  app.use(cors());
  app.use(express.static(resolve(__dirname, '../../public')));

  const httpServer = createServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: '*' },
  });

  const chatHandler = container.get<ChatHandler>(TYPES.ChatHandler);
  chatHandler.register(io);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
