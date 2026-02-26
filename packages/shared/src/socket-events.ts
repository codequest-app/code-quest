import type {
  ChatAbortPayload,
  ChatCreatePayload,
  ChatKillPayload,
  ChatSendPayload,
} from './schemas/chat.ts';

export interface ChatStreamEvent {
  type: string;
  [key: string]: unknown;
}

export interface ClientToServerEvents {
  'chat:create': (
    payload: ChatCreatePayload,
    callback: (response: { sessionId: string }) => void,
  ) => void;
  'chat:send': (payload: ChatSendPayload) => void;
  'chat:abort': (payload: ChatAbortPayload) => void;
  'chat:kill': (payload: ChatKillPayload) => void;
}

export interface ServerToClientEvents {
  'chat:created': (payload: { sessionId: string }) => void;
  'chat:event': (payload: { sessionId: string; event: ChatStreamEvent }) => void;
  'chat:error': (payload: { sessionId?: string; message: string }) => void;
  'chat:exit': (payload: { sessionId: string }) => void;
}
