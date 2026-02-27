export type SessionStatus = 'disconnected' | 'idle' | 'processing';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  type: 'text' | 'thinking' | 'tool_use' | 'tool_result' | 'error' | 'control_request';
  content: string;
  meta?: Record<string, unknown>;
  timestamp: number;
}
