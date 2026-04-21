import type { ListFilesResponse, RpcResult, TerminalGetContentsResponse } from '@code-quest/shared';
import { EVENTS } from '@code-quest/shared';
import type { TypedSocket } from '@/socket/client';
import { rpc } from '@/socket/rpc';

// ── Actions (emit) ──

interface FileActionsDeps {
  socket: TypedSocket;
  channelId: string;
}

export function createFileActions({ socket, channelId }: FileActionsDeps) {
  function searchFiles(pattern: string): Promise<ListFilesResponse> {
    return rpc(socket, EVENTS.file.list, { channelId, pattern });
  }

  function getTerminalContents(): Promise<TerminalGetContentsResponse> {
    return rpc(socket, EVENTS.terminal.read, { channelId });
  }

  function openClaudeTerminal(): Promise<RpcResult<{ channelId: string }>> {
    return rpc(socket, EVENTS.terminal.open_claude, { channelId });
  }

  return { searchFiles, getTerminalContents, openClaudeTerminal };
}
