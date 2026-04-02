import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, normalize, resolve } from 'node:path';
import { fileListSchema, fileReadPayloadSchema } from '@code-quest/shared';
import type { Channel } from '../channel.ts';
import { type ChannelEmitter, withChannel, withError } from '../channel-emitter.ts';
import type { ChannelManager } from '../channel-manager.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { rgAvailable, rgListFiles } from '../utils/rg.ts';

export function create(channelManager: ChannelManager, emitter: ChannelEmitter): void {
  function handleRead(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
    const { filePath } = fileReadPayloadSchema.parse(payload);
    const cwd = ch.workspaceFolder ?? process.cwd();
    const absolute = resolve(cwd, normalize(filePath));
    if (!absolute.startsWith(`${cwd}/`) && absolute !== cwd) {
      callback?.({ error: 'Path traversal not allowed' });
      return;
    }
    try {
      const content = readFileSync(absolute, 'utf-8');
      callback?.({ content });
    } catch {
      callback?.({ error: `File not found: ${filePath}` });
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

  function handleList(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
    try {
      const { pattern } = fileListSchema.parse(payload);
      const cwd = ch.workspaceFolder ?? process.cwd();
      const pat = pattern.toLowerCase();

      const fileResults = rgAvailable ? listWithRg(cwd, pat) : listWithWalk(cwd, pat);
      const combined = [...fileResults, ...listTerminals(pat)].slice(0, 20);
      callback?.({ files: combined });
    } catch {
      callback?.({ files: [] });
    }
  }

  emitter.on('file:read', withError(withChannel(handleRead)));
  emitter.on('file:list', withChannel(handleList));
}
