import 'reflect-metadata';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
import type { ProcessFactory } from '@code-quest/summoner';
import cors from 'cors';
import { desc, eq } from 'drizzle-orm';
import express from 'express';
import { Server } from 'socket.io';
import { createContainer } from '../container.ts';
import type { DrizzleDatabase } from '../db/client.ts';
import { events, sessions } from '../db/schema.ts';
import type { ChatHandler } from '../socket/chat-handler.ts';
import { TYPES } from '../types.ts';

const PORT = Number(process.env.PORT ?? 3001);

const processFactory: ProcessFactory = (command, args, options) => spawn(command, args, options);

const container = createContainer({
  processFactory,
  dbPath: process.env.DB_PATH ?? './data/code-quest.db',
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

const db = container.get<DrizzleDatabase>(TYPES.Database);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/sessions', async (_req, res) => {
  const rows = await db.select().from(sessions).orderBy(desc(sessions.createdAt));
  res.json(rows);
});

app.get('/api/sessions/:id/events', async (req, res) => {
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.sessionId, req.params.id))
    .orderBy(events.createdAt);
  res.json(rows.map((r) => ({ ...r, data: JSON.parse(r.data) })));
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
