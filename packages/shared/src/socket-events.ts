import type {
  ChatAbortPayload,
  ChatControlResponsePayload,
  ChatCreatePayload,
  ChatKillPayload,
  ChatSendPayload,
} from './schemas/chat.ts';

export interface ChatStats {
  costUsd?: number;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export type ChatStreamEvent =
  | { type: 'init'; sessionId: string; model?: string; tools?: string[] }
  | { type: 'text'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; id: string; name: string; output: string }
  | { type: 'result'; stats: ChatStats }
  | { type: 'status'; message: string }
  | { type: 'error'; message: string }
  | {
      type: 'control_response';
      requestId: string;
      success: boolean;
      response?: Record<string, unknown>;
      error?: string;
    }
  | {
      type: 'control_request';
      requestId: string;
      subtype: string;
      toolName?: string;
      input?: unknown;
      callbackId?: string;
      toolUseId?: string;
    };

export interface ClientToServerEvents {
  'chat:create': (
    payload: ChatCreatePayload,
    callback: (response: { sessionId: string }) => void,
  ) => void;
  'chat:send': (payload: ChatSendPayload) => void;
  'chat:abort': (payload: ChatAbortPayload) => void;
  'chat:kill': (payload: ChatKillPayload) => void;
  'chat:control_response': (payload: ChatControlResponsePayload) => void;
}

export interface ServerToClientEvents {
  'chat:created': (payload: { sessionId: string }) => void;
  'chat:event': (payload: { sessionId: string; event: ChatStreamEvent }) => void;
  'chat:error': (payload: { sessionId?: string; message: string }) => void;
  'chat:exit': (payload: { sessionId: string }) => void;
}
