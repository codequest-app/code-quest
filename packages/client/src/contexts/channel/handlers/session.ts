import type {
  ForkConversationResponse,
  PluginReloadResult,
  RawEventsResponse,
  RewindResult,
  RpcResult,
  SideQuestionResult,
} from '@code-quest/shared';
import { EVENTS, isRecord } from '@code-quest/shared';
import type { TypedSocket } from '@/socket/client';
import { rpc } from '@/socket/rpc';
import type { ChannelState } from '@/types/chat';
import type { Payload } from './guard';

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
  disconnect: onDisconnect,
} satisfies Record<string, (state: ChannelState, payload: never) => ChannelState>;

// ── Actions (emit) ──

interface SessionActionsDeps {
  socket: TypedSocket;
  channelId: string;
}

export function createSessionActions({ socket, channelId }: SessionActionsDeps) {
  function fetchRawEvents(): Promise<RawEventsResponse> {
    return rpc(socket, EVENTS.session.raw_events, { channelId });
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

  function forkSession(messageId: string): Promise<ForkConversationResponse> {
    return rpc(socket, EVENTS.session.fork, {
      forkedFromChannelId: channelId,
      resumeSessionAt: messageId,
      newChannelId: crypto.randomUUID(),
    });
  }

  function rewindToMessage(userMessageId: string): Promise<RpcResult<RewindResult>> {
    return rpc(socket, EVENTS.chat.rewind_code, { channelId, userMessageId });
  }

  function askSideQuestion(question: string): Promise<RpcResult<SideQuestionResult>> {
    return rpc(socket, EVENTS.chat.ask_side_question, { channelId, question });
  }

  function reloadPlugins(): Promise<PluginReloadResult> {
    return rpc(socket, EVENTS.plugin.reload, { channelId });
  }

  return {
    fetchRawEvents,
    subscribeRawEvents,
    forkSession,
    rewindToMessage,
    askSideQuestion,
    reloadPlugins,
  };
}
