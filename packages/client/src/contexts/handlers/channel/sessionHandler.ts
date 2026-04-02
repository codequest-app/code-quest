import type { FileSearchResult, ServerToClientEvents } from '@code-quest/shared';
import type { TypedSocket } from '../../../socket/client';
import { rpc } from '../../../socket/rpc';
import type { ChannelState } from '../../../types/chat';

type Payload<E extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[E]>[0];

// ── On handlers ──

function onSessionStatus(state: ChannelState, p: Payload<'session:status'>): ChannelState {
  return { ...state, statusText: p.status || null };
}

function onDisconnect(state: ChannelState): ChannelState {
  return { ...state, status: 'disconnected' };
}

// ── Handler map ──

export const sessionHandlerOn = {
  'session:status': onSessionStatus,
  'disconnect': onDisconnect,
} satisfies Record<string, (state: ChannelState, payload: never) => ChannelState>;

// ── Actions (emit) ──

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

interface SessionActionsDeps {
  socket: TypedSocket;
  channelId: string;
}

export function createSessionActions({ socket, channelId }: SessionActionsDeps) {
  function fetchRawEvents(): Promise<{ events: unknown[] }> {
    return rpc(socket, 'session:raw_events', { channelId });
  }

  function subscribeRawEvents(cb: (evt: unknown) => void): () => void {
    const handler = (eventName: string, ...args: unknown[]) => {
      const payload = isRecord(args[0]) ? args[0] : undefined;
      if (payload?.channelId && payload.channelId !== channelId) return;
      cb({ type: eventName, ...(payload ?? {}) });
    };
    socket.onAny(handler);
    return () => socket.offAny(handler);
  }

  function forkSession(messageId: string): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    return rpc(socket, 'session:fork', {
      forkedFromSession: channelId,
      resumeSessionAt: messageId,
      newSessionId: crypto.randomUUID(),
    });
  }

  function rewindToMessage(userMessageId: string, dryRun = false): Promise<{ success: boolean; error?: string }> {
    return rpc(socket, 'chat:rewind_code', { channelId, userMessageId, dryRun });
  }

  return { fetchRawEvents, subscribeRawEvents, forkSession, rewindToMessage };
}
