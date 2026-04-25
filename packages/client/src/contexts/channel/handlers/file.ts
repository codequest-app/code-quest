import type { FsSearchResponse, RpcResult, TerminalGetContentsResponse } from '@code-quest/shared';
import { EVENTS } from '@code-quest/shared';
import type { TypedSocket } from '@/socket/client';
import { rpc } from '@/socket/rpc';

// ── Actions (emit) ──

interface FileActionsDeps {
  socket: TypedSocket;
  channelId: string;
  /** Channel's working directory — required for cwd-scoped fs:search.
   *  Sourced from `useChannelMeta()` in ChannelMessagesContext. */
  cwd?: string;
}

export function createFileActions({ socket, channelId, cwd }: FileActionsDeps) {
  function searchFiles(pattern: string): Promise<FsSearchResponse> {
    // No cwd → no scope to search in. Return empty rather than crash; the
    // mention picker just shows nothing.
    if (!cwd) return Promise.resolve({ ok: true as const, data: { files: [] } });
    return rpc(socket, EVENTS.fs.search, { cwd, pattern });
  }

  function getTerminalContents(): Promise<TerminalGetContentsResponse> {
    return rpc(socket, EVENTS.terminal.read, { channelId });
  }

  function openClaudeTerminal(): Promise<RpcResult<{ channelId: string }>> {
    return rpc(socket, EVENTS.terminal.open_claude, { channelId });
  }

  return { searchFiles, getTerminalContents, openClaudeTerminal };
}
