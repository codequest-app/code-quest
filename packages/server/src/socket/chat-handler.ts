import type { ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
import {
  chatAbortSchema,
  chatControlResponseSchema,
  chatCreateSchema,
  chatKillSchema,
  chatSendSchema,
} from '@code-quest/shared';
import { inject, injectable } from 'inversify';
import type { Server, Socket } from 'socket.io';
import type { RawEventStore } from '../services/raw-event-store.ts';
import type { SessionManager } from '../services/session-manager.ts';
import { TYPES } from '../types.ts';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

@injectable()
export class ChatHandler {
  constructor(
    @inject(TYPES.SessionManager) private sessionManager: SessionManager,
    @inject(TYPES.RawEventStore) private rawEventStore: RawEventStore,
  ) {}

  register(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
    io.on('connection', (socket) => this.handleConnection(socket));
  }

  private handleConnection(socket: TypedSocket): void {
    socket.on('chat:create', (payload, callback) => {
      try {
        const parsed = chatCreateSchema.parse(payload);
        const session = this.sessionManager.create(parsed.resumeSessionId);

        session.on('event', (event) => {
          socket.emit('chat:event', { sessionId: session.id, event });
        });

        session.on('raw', (entry) => {
          this.rawEventStore.append(entry).catch((err) => {
            console.error('Failed to persist raw event:', err);
          });
        });

        session.on('error', (message) => {
          socket.emit('chat:error', { sessionId: session.id, message });
        });

        session.on('exit', () => {
          socket.emit('chat:exit', { sessionId: session.id });
        });

        socket.emit('chat:created', { sessionId: session.id });
        if (typeof callback === 'function') {
          callback({ sessionId: session.id });
        }
      } catch (err) {
        socket.emit('chat:error', {
          message: err instanceof Error ? err.message : 'Failed to create session',
        });
      }
    });

    socket.on('chat:send', (payload) => {
      try {
        const { sessionId, message } = chatSendSchema.parse(payload);
        const session = this.sessionManager.get(sessionId);
        if (!session) {
          socket.emit('chat:error', { sessionId, message: 'Session not found' });
          return;
        }
        session.sendMessage(message);
      } catch (err) {
        socket.emit('chat:error', {
          message: err instanceof Error ? err.message : 'Failed to send message',
        });
      }
    });

    socket.on('chat:abort', (payload) => {
      try {
        const { sessionId } = chatAbortSchema.parse(payload);
        const session = this.sessionManager.get(sessionId);
        if (session) {
          session.abort();
        }
      } catch {
        // ignore
      }
    });

    socket.on('chat:kill', (payload) => {
      try {
        const { sessionId } = chatKillSchema.parse(payload);
        this.sessionManager.kill(sessionId);
      } catch {
        // ignore
      }
    });

    socket.on('chat:control_response', (payload) => {
      try {
        const { sessionId, requestId, response } = chatControlResponseSchema.parse(payload);
        const session = this.sessionManager.get(sessionId);
        if (!session) {
          socket.emit('chat:error', { sessionId, message: 'Session not found' });
          return;
        }
        session.respondToControlRequest(requestId, response);
      } catch (err) {
        socket.emit('chat:error', {
          message: err instanceof Error ? err.message : 'Failed to respond to control request',
        });
      }
    });

    socket.on('disconnect', () => {
      // Sessions persist beyond socket disconnect for now
    });
  }
}
