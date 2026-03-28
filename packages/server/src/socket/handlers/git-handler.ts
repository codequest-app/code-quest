import { spawnSync } from 'node:child_process';
import {
  gitCheckoutSchema,
  gitExecSchema,
  gitLogSchema,
  gitUpdateSkippedBranchSchema,
} from '@code-quest/shared';
import type { RawEntry } from '@code-quest/summoner';
import type { HandlerContext, TypedSocket } from '../handler-context.ts';
import { errMsg } from '../handler-context.ts';
import { execGit } from './helpers.ts';

export function register(socket: TypedSocket, ctx: HandlerContext): void {
  socket.on('check_git_status', async (callback) => {
    try {
      const [branchOut, statusOut] = await Promise.all([
        execGit(['rev-parse', '--abbrev-ref', 'HEAD']),
        execGit(['status', '--porcelain']),
      ]);
      const branch = branchOut.trim();
      const lines = statusOut.trim().split('\n').filter(Boolean);
      const changedFiles = lines.map((line) => ({
        status: line.substring(0, 2).trim(),
        file: line.substring(3),
      }));

      callback({ branch, isClean: changedFiles.length === 0, changedFiles });
    } catch {
      callback({ branch: 'unknown', isClean: true, changedFiles: [] });
    }
  });

  socket.on('checkout_branch', async (payload, callback) => {
    try {
      const { branch } = gitCheckoutSchema.parse(payload);
      try {
        await execGit(['checkout', branch]);
      } catch {
        try {
          await execGit(['fetch', 'origin']);
          await execGit(['checkout', branch]);
        } catch {
          await execGit(['checkout', '--track', `origin/${branch}`]);
        }
      }
      callback({ success: true });
    } catch (err) {
      callback({
        success: false,
        error: errMsg(err, 'Failed to checkout'),
      });
    }
  });

  socket.on('git:log', async (payload, callback) => {
    try {
      const { limit } = gitLogSchema.parse(payload);
      const n = limit ?? 20;
      const stdout = await execGit(['log', `--format=%H|%s|%an|%ai`, `-n`, String(n)]);
      const entries = stdout
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [hash, message, author, date] = line.split('|');
          return { hash, message, author, date };
        });
      callback({ entries });
    } catch {
      callback({ entries: [] });
    }
  });

  socket.on('git:diff', async (callback) => {
    try {
      const diff = await execGit(['diff']);
      callback({ diff });
    } catch {
      callback({ diff: '' });
    }
  });

  socket.on('update_skipped_branch', async (payload, callback) => {
    try {
      const { channelId, branch, failed } = gitUpdateSkippedBranchSchema.parse(payload);
      const entry: RawEntry = {
        timestamp: Date.now(),
        sessionId: await ctx.resolveSessionId(channelId),
        promptId: '',
        direction: 'out',
        raw: JSON.stringify({
          type: 'teleport-skipped-branch',
          branch,
          failed,
        }),
        seq: 0,
      };
      await ctx.rawEventStore.append(entry);
      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to update skipped branch') });
    }
  });

  socket.on('exec', async (payload, callback) => {
    try {
      const { command, args } = gitExecSchema.parse(payload);
      const { stdout, stderr, status } = spawnSync(command, args ?? [], {
        cwd: process.cwd(),
        timeout: 30_000,
        encoding: 'utf-8',
      });
      callback({
        exitCode: status ?? -1,
        stdout: stdout ?? '',
        stderr: stderr ?? '',
      });
    } catch (err) {
      callback({ exitCode: -1, stdout: '', stderr: errMsg(err, 'Failed to execute command') });
    }
  });
}
