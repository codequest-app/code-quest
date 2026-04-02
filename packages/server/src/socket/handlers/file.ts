import { readdirSync, readFileSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, normalize, resolve } from 'node:path';
import { fileListSchema, fileUpdatedPayloadSchema } from '@code-quest/shared';
import type { ServerAction } from '@code-quest/summoner';
import type { Channel } from '../channel.ts';
import { type ChannelEmitter, withChannel, withError } from '../channel-emitter.ts';
import type { ChannelManager } from '../channel-manager.ts';
import type { SocketCallback, SocketHandler, TypedSocket } from '../types.ts';
import { rgAvailable, rgListFiles } from '../utils/rg.ts';

export function create(channelManager: ChannelManager, emitter: ChannelEmitter): void {
  function handleRead(
    payload: { channelId: string; filePath: string },
    callback: SocketCallback,
  ): void {
    const channel = channelManager.get(payload.channelId);
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

  type FileResult = { path: string; name: string; type: 'file' | 'directory' | 'terminal' };

  function listWithRg(cwd: string, pattern: string): FileResult[] {
    const lines = rgListFiles(cwd);
    const matched = lines.filter((l) => l.toLowerCase().includes(pattern));
    return matched.map((rel) => {
      const name = rel.split('/').pop() ?? rel;
      let type: 'file' | 'directory' = 'file';
      try {
        type = statSync(join(cwd, rel)).isDirectory() ? 'directory' : 'file';
      } catch {
        // default to file
      }
      return { path: rel, name, type };
    });
  }

  function listWithWalk(cwd: string, pattern: string): FileResult[] {
    const results: FileResult[] = [];
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
        if (entry.toLowerCase().includes(pattern)) {
          results.push({ path: rel, name: entry, type: isDir ? 'directory' : 'file' });
        }
        if (isDir) walk(full, depth + 1);
      }
    };

    walk(cwd, 0);
    return results;
  }

  function listTerminals(pattern: string): FileResult[] {
    const results: FileResult[] = [];
    for (const routingId of channelManager.getAllChannelIds()) {
      if (routingId.toLowerCase().includes(pattern)) {
        results.push({ type: 'terminal', path: routingId, name: routingId });
      }
    }
    return results;
  }

  function handleList(payload: unknown, callback: SocketCallback): void {
    try {
      const { pattern } = fileListSchema.parse(payload);
      const cwd = process.cwd();
      const pat = pattern.toLowerCase();

      const fileResults = rgAvailable ? listWithRg(cwd, pat) : listWithWalk(cwd, pat);
      const combined = [...fileResults, ...listTerminals(pat)].slice(0, 20);
      callback({ files: combined });
    } catch {
      callback({ files: [] });
    }
  }

  function onFileUpdated(ch: Channel, payload: unknown): void {
    const { filePath, oldContent, newContent } = fileUpdatedPayloadSchema.parse(payload);
    emitter.emit(ch.id, 'file:updated', { channelId: ch.id, filePath, oldContent, newContent });
  }

  function onReadDiff(ch: Channel, payload: unknown): void {
    const action = payload as ServerAction;
    if (action.action !== 'read_diff') return;
    const readFileOrEmpty = (path: string) => readFile(path, 'utf-8').catch(() => '');
    void Promise.all([readFileOrEmpty(action.originalPath), readFileOrEmpty(action.newPath)]).then(
      ([oldContent, newContent]) => {
        ch.trackControlRequest(action.requestId, { subtype: 'open_diff' });
        emitter.emit(ch.id, 'control:diff_review', {
          channelId: ch.id,
          requestId: action.requestId,
          toolId: action.requestId,
          filePath: action.originalPath || action.newPath,
          oldContent,
          newContent,
        });
      },
    );
  }

  emitter.on('file:read', withError((_ch, payload, _socket, cb) => handleRead(payload as { channelId: string; filePath: string }, cb!)));
  emitter.on('file:list', (_ch, payload, _socket, cb) => handleList(payload, cb!));
  emitter.on('system:file_updated', withChannel(onFileUpdated));
  emitter.on('server:action', withChannel(onReadDiff));
}
