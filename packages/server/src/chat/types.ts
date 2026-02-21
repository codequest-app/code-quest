/**
 * Chat types — re-exports from cli-adapter + server-only types.
 */

import type { ChatProvider } from '@code-quest/shared';

export type {
  ChatSession,
  ChatSessionDeps,
  ChatSessionMode,
  ChatSessionOptions,
  ChatSessionState,
  ControlResponse,
  ParserFactory,
  ProcessFactory,
  StreamParser,
} from '@code-quest/cli-adapter';

import type { ChatSession, ChatSessionMode, ChatSessionOptions } from '@code-quest/cli-adapter';

export type ChatSessionFactory = (options: ChatSessionOptions) => ChatSession;

export type ChatCommandsConfig = Record<
  ChatProvider,
  { command: string; baseArgs: string[]; mode?: ChatSessionMode }
>;

export interface ChatManager {
  createSession(options: { provider: ChatProvider; cwd?: string }): ChatSession;
  getSession(id: string): ChatSession | undefined;
  removeSession(id: string): void;
  listSessions(): string[];
  cleanup(): void;
}
