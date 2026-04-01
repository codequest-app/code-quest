import { readdirSync, readFileSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, normalize, resolve } from 'node:path';
import { fileListSchema, fileUpdatedPayloadSchema, type SocketEvent } from '@code-quest/shared';
import type { ServerAction } from '@code-quest/summoner';
import type { Channel } from '../channel.ts';
import type { ChannelEventRouter } from '../channel-event-router.ts';
import type { HandlerContext } from '../context.ts';
import type { SocketHandler, TypedSocket } from '../types.ts';
import { rgAvailable, rgListFiles } from './rg.ts';

export function create(ctx: HandlerContext): SocketHandler {
  function handleRead(payload: { channelId: string; filePath: string }, callback: Function): void {
    const channel = ctx.channelManager.get(payload.channelId);
    if (!channel) {
      callback({ error: 'Session not found' });
      return;
    }
    const cwd = channel.sessionState.cwd ?? process.cwd();
    const absolute = resolve(cwd, normalize(payload.filePath));
    if (!absolute.startsWith(`${cwd}/`) && absolute !== cwd) {
      callback({ error: 'Path traversal not allowed' });
      return;
    }
    try {
      const content = readFileSync(absolute, 'utf-8');
      callback({ content });
    } catch {
      callback({ error: `File not found: ${payload.filePath}` });
    }
  }

  function handleList(payload: unknown, callback: Function): void {
    try {
      const { pattern } = fileListSchema.parse(payload);
      const cwd = process.cwd();
      const pat = pattern.toLowerCase();

      let fileResults: Array<{
        path: string;
        name: string;
        type: 'file' | 'directory' | 'terminal';
      }>;

      if (rgAvailable) {
        const lines = rgListFiles(cwd);
        const matched = lines.filter((l) => l.toLowerCase().includes(pat));
        fileResults = matched.map((rel) => {
          const name = rel.split('/').pop() ?? rel;
          let type: 'file' | 'directory' = 'file';
          try {
            type = statSync(join(cwd, rel)).isDirectory() ? 'directory' : 'file';
          } catch {
            // default to file
          }
          return { path: rel, name, type };
        });
      } else {
        fileResults = [];

        const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage', 'logs']);
        const walk = (dir: string, depth: number) => {
          if (depth > 4) return;
          let entries: string[];
          try {
            entries = readdirSync(dir);
          } catch {
            return;
          }
          for (const entry of entries) {
            if (SKIP_DIRS.has(entry)) continue;
            const full = join(dir, entry);
            const rel = full.slice(cwd.length + 1);
            let isDir = false;
            try {
              isDir = statSync(full).isDirectory();
            } catch {
              continue;
            }
            if (entry.toLowerCase().includes(pat)) {
              fileResults.push({ path: rel, name: entry, type: isDir ? 'directory' : 'file' });
            }
            if (isDir) walk(full, depth + 1);
          }
        };

        walk(cwd, 0);
      }

      // Add matching active channels as terminal results
      const terminalResults: Array<{ path: string; name: string; type: 'terminal' }> = [];
      for (const routingId of ctx.channelManager.getAllChannelIds()) {
        if (routingId.toLowerCase().includes(pat)) {
          terminalResults.push({ type: 'terminal', path: routingId, name: routingId });
        }
      }

      const combined = [...fileResults, ...terminalResults].slice(0, 20);
      callback({ files: combined });
    } catch {
      callback({ files: [] });
    }
  }

  function onFileUpdated(channelId: string, ch: Channel, se: SocketEvent): void {
    const { filePath, oldContent, newContent } = fileUpdatedPayloadSchema.parse(se.payload);
    ch.emit('file:updated', { channelId, filePath, oldContent, newContent });
  }

  function onReadDiff(channelId: string, ch: Channel, action: ServerAction): boolean {
    if (action.action !== 'read_diff') return false;
    const readFileOrEmpty = (path: string) => readFile(path, 'utf-8').catch(() => '');
    void Promise.all([readFileOrEmpty(action.originalPath), readFileOrEmpty(action.newPath)]).then(
      ([oldContent, newContent]) => {
        ch.trackControlRequest(action.requestId, { subtype: 'open_diff' });
        ch.emit('control:diff_review', {
          channelId,
          requestId: action.requestId,
          toolId: action.requestId,
          filePath: action.originalPath || action.newPath,
          oldContent,
          newContent,
        });
      },
    );
    return true;
  }

  return {
    register(socket: TypedSocket) {
      socket.on('file:read', (p, cb) => handleRead(p, cb));
      socket.on('file:list', (p, cb) => handleList(p, cb));
    },
    subscribe(router: ChannelEventRouter) {
      router.onEvent('system:file_updated', onFileUpdated);
      router.onAction(onReadDiff);
    },
  };
}
