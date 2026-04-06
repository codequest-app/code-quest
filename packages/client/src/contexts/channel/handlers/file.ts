import type {
  ListFilesResponse,
  SuccessResponse,
  TerminalGetContentsResponse,
} from '@code-quest/shared';
import type { TypedSocket } from '@/socket/client';
import { rpc } from '@/socket/rpc';

// ── Actions (emit) ──

interface FileActionsDeps {
  socket: TypedSocket;
  channelId: string;
}

export function createFileActions({ socket, channelId }: FileActionsDeps) {
  function searchFiles(pattern: string): Promise<ListFilesResponse> {
    return rpc(socket, 'file:list', { channelId, pattern });
  }

  function getTerminalContents(): Promise<TerminalGetContentsResponse> {
    return rpc(socket, 'terminal:read', { channelId });
  }

  function openClaudeTerminal(): Promise<SuccessResponse> {
    return rpc(socket, 'terminal:open_claude', { channelId });
  }

  return { searchFiles, getTerminalContents, openClaudeTerminal };
}
