import { spawnSync } from 'node:child_process';
import {
  gitCheckoutSchema,
  gitExecSchema,
  gitLogSchema,
  gitUpdateSkippedBranchSchema,
} from '@code-quest/shared';
import type { RawEntry } from '@code-quest/summoner';
import type { RawEventStore } from '../../services/raw-event-store.ts';
import type { Channel } from '../channel.ts';
import type { ChannelEmitter } from '../channel-emitter.ts';
import type { SessionHistory } from '../session-history.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { checkoutBranch, execGit } from '../utils/exec-git.ts';
import { errMsg } from '../utils/helpers.ts';

export function create(
  sessionHistory: SessionHistory,
  rawEventStore: RawEventStore,
  emitter: ChannelEmitter,
): void {
  function handleStatus(_ch: Channel | null, _payload: unknown, _socket?: TypedSocket, callback?: SocketCallback): void {
    Promise.all([
      execGit(['rev-parse', '--abbrev-ref', 'HEAD']),
      execGit(['status', '--porcelain']),
    ])
      .then(([branchOut, statusOut]) => {
        const branch = branchOut.trim();
        const lines = statusOut.trim().split('\n').filter(Boolean);
        const changedFiles = lines.map((line) => ({
          status: line.substring(0, 2).trim(),
          file: line.substring(3),
        }));
        callback?.({ branch, isClean: changedFiles.length === 0, changedFiles });
      })
      .catch(() => {
        callback?.({ branch: 'unknown', isClean: true, changedFiles: [] });
      });
  }

  async function handleCheckout(_ch: Channel | null, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback): Promise<void> {
    try {
      const { branch } = gitCheckoutSchema.parse(payload);
      await checkoutBranch(branch);
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Failed to checkout') });
    }
  }

  async function handleLog(_ch: Channel | null, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback): Promise<void> {
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
      callback?.({ entries });
    } catch {
      callback?.({ entries: [] });
    }
  }

  async function handleDiff(_ch: Channel | null, _payload: unknown, _socket?: TypedSocket, callback?: SocketCallback): Promise<void> {
    try {
      const diff = await execGit(['diff']);
      callback?.({ diff });
    } catch {
      callback?.({ diff: '' });
    }
  }

  async function handleUpdateSkippedBranch(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { channelId, branch, failed } = gitUpdateSkippedBranchSchema.parse(payload);
      const entry: RawEntry = {
        timestamp: Date.now(),
        sessionId: await sessionHistory.resolveSessionId(channelId),
        promptId: '',
        direction: 'out',
        raw: JSON.stringify({ type: 'teleport-skipped-branch', branch, failed }),
        seq: 0,
      };
      await rawEventStore.append(entry);
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Failed to update skipped branch') });
    }
  }

  function handleExec(_ch: Channel | null, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback): void {
    try {
      const { command, args } = gitExecSchema.parse(payload);
      const { stdout, stderr, status } = spawnSync(command, args ?? [], {
        cwd: process.cwd(),
        timeout: 30_000,
        encoding: 'utf-8',
      });
      callback?.({ exitCode: status ?? -1, stdout: stdout ?? '', stderr: stderr ?? '' });
    } catch (err) {
      callback?.({ exitCode: -1, stdout: '', stderr: errMsg(err, 'Failed to execute command') });
    }
  }

  emitter.on('git:status', handleStatus);
  emitter.on('git:checkout', handleCheckout);
  emitter.on('git:log', handleLog);
  emitter.on('git:diff', handleDiff);
  emitter.on('git:update_skipped_branch', handleUpdateSkippedBranch);
  emitter.on('git:exec', handleExec);
}
