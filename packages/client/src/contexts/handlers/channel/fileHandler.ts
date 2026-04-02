import type { FileSearchResult } from '@code-quest/shared';
import type { TypedSocket } from '../../../socket/client';
import { rpc } from '../../../socket/rpc';

// ── Actions (emit) ──

interface FileActionsDeps {
  socket: TypedSocket;
  channelId: string;
}

export function createFileActions({ socket, channelId }: FileActionsDeps) {
  function searchFiles(pattern: string): Promise<{ files: FileSearchResult[] }> {
    return rpc(socket, 'file:list', { channelId, pattern });
  }

  function getTerminalContents(): Promise<{ content: string | null }> {
    return rpc(socket, 'terminal:read', { channelId });
  }

  function openClaudeTerminal(): Promise<{ success: boolean; error?: string }> {
    return rpc(socket, 'terminal:open_claude', { channelId });
  }

  return { searchFiles, getTerminalContents, openClaudeTerminal };
}
