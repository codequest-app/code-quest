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
import { type ChannelEmitter, withChannel, withError } from '../channel-emitter.ts';
import type { SessionHistory } from '../session-history.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { checkoutBranch, execGit } from '../utils/exec-git.ts';
import { errMsg } from '../utils/helpers.ts';

export function create(
  sessionHistory: SessionHistory,
  rawEventStore: RawEventStore,
  emitter: ChannelEmitter,
): void {
  function handleStatus(
    ch: Channel,
    _payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
    const cwd = ch.workspaceFolder;
    Promise.all([
      execGit(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd }),
      execGit(['status', '--porcelain'], { cwd }),
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

  async function handleCheckout(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { branch } = gitCheckoutSchema.parse(payload);
      await checkoutBranch(branch, ch.workspaceFolder);
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Failed to checkout') });
    }
  }

  async function handleLog(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { limit } = gitLogSchema.parse(payload);
      const n = limit ?? 20;
      const stdout = await execGit(['log', `--format=%H|%s|%an|%ai`, `-n`, String(n)], {
        cwd: ch.workspaceFolder,
      });
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

  async function handleDiff(
    ch: Channel,
    _payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const diff = await execGit(['diff'], { cwd: ch.workspaceFolder });
      callback?.({ diff });
    } catch {
      callback?.({ diff: '' });
    }
  }

  async function handleUpdateSkippedBranch(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { branch, failed } = gitUpdateSkippedBranchSchema.parse(payload);
      const entry: RawEntry = {
        timestamp: Date.now(),
        sessionId: await sessionHistory.resolveSessionId(ch.id),
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

  function handleExec(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
    try {
      const { command, args } = gitExecSchema.parse(payload);
      const { stdout, stderr, status } = spawnSync(command, args ?? [], {
        cwd: ch.workspaceFolder,
        timeout: 30_000,
        encoding: 'utf-8',
      });
      callback?.({ exitCode: status ?? -1, stdout: stdout ?? '', stderr: stderr ?? '' });
    } catch (err) {
      callback?.({ exitCode: -1, stdout: '', stderr: errMsg(err, 'Failed to execute command') });
    }
  }

  emitter.on('git:status', withChannel(handleStatus));
  emitter.on('git:checkout', withChannel(handleCheckout));
  emitter.on('git:log', withChannel(handleLog));
  emitter.on('git:diff', withChannel(handleDiff));
  emitter.on('git:update_skipped_branch', withError(withChannel(handleUpdateSkippedBranch)));
  emitter.on('git:exec', withChannel(handleExec));
}
