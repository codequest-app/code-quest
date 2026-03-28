import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, normalize, resolve } from 'node:path';
import {
  fileListSchema,
  terminalGetContentsSchema,
  terminalOpenClaudeSchema,
} from '@code-quest/shared';
import type { HandlerContext, TypedSocket } from '../handler-context.ts';
import { errMsg } from '../handler-context.ts';
import { rgAvailable, rgListFiles } from './helpers.ts';

export function register(socket: TypedSocket, ctx: HandlerContext): void {
  socket.on('file:read', ({ channelId, filePath }, callback) => {
    const channel = ctx.channelManager.get(channelId);
    if (!channel) {
      callback({ error: 'Session not found' });
      return;
    }
    const cwd = (channel.sessionState.cwd as string) || process.cwd();
    const absolute = resolve(cwd, normalize(filePath));
    if (!absolute.startsWith(`${cwd}/`) && absolute !== cwd) {
      callback({ error: 'Path traversal not allowed' });
      return;
    }
    try {
      const content = readFileSync(absolute, 'utf-8');
      callback({ content });
    } catch {
      callback({ error: `File not found: ${filePath}` });
    }
  });

  socket.on('list_files_request', (payload, callback) => {
    const parsed = fileListSchema.safeParse(payload);
    if (!parsed.success) {
      callback({ files: [] });
      return;
    }
    const { pattern } = parsed.data;
    try {
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
  });

  socket.on('terminal:get_contents', (payload, callback) => {
    try {
      const { channelId } = terminalGetContentsSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      if (!channel || channel.terminalLines.length === 0) {
        callback({ content: null });
        return;
      }
      const lines = channel.terminalLines.slice(-100);
      callback({ content: lines.join('\n') });
    } catch {
      callback({ content: null });
    }
  });

  socket.on('terminal:open_claude', async (payload, callback) => {
    try {
      const { channelId, prompt, cwd } = terminalOpenClaudeSchema.parse(payload);
      const existingChannel = ctx.channelManager.get(channelId);
      const baseCwd =
        cwd ?? (existingChannel?.sessionState.cwd as string | undefined) ?? process.cwd();

      const newChannelId = crypto.randomUUID();
      const hooks = ctx.buildChannelHooks(newChannelId);
      const { channel: ch } = await ctx.channelManager.create(newChannelId, {
        hooks,
        onBeforeSpawn: (c) => ctx.addSocketToChannel(c, socket),
      });
      ch.sessionState = { ...ch.sessionState, cwd: baseCwd };

      ctx.io?.emit('session:states', {
        sessions: [{ channelId: newChannelId, state: 'idle' }],
      });

      if (prompt) {
        ch.runner.sendMessage(prompt);
      }

      callback({ success: true, channelId: newChannelId });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to open claude terminal') });
    }
  });
}
