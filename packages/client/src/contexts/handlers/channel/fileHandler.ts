import type { FileSearchResult, ServerToClientEvents } from '@code-quest/shared';
import type { TypedSocket } from '../../../socket/client';
import { rpc } from '../../../socket/rpc';
import type { ChannelState } from '../../../types/chat';

type Payload<E extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[E]>[0];

// ── On handlers ──

function onFileUpdated(state: ChannelState, p: Payload<'file:updated'>): ChannelState {
  return {
    ...state,
    modifiedFiles: {
      ...state.modifiedFiles,
      [p.filePath]: { oldContent: p.oldContent, newContent: p.newContent },
    },
  };
}

export const fileHandlerOn = {
  'file:updated': onFileUpdated,
} satisfies Record<string, (state: ChannelState, payload: never) => ChannelState>;

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
