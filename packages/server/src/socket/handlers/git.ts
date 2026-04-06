import { spawnSync } from 'node:child_process';
import {
  gitCheckoutPayloadSchema,
  gitExecPayloadSchema,
  gitLogPayloadSchema,
  gitUpdateSkippedBranchPayloadSchema,
} from '@code-quest/shared';
import type { RawEntry } from '@code-quest/summoner';
import { logger } from '../../logger.ts';
import type { RawEventStore } from '../../services/raw-event-store.ts';
import type { Channel } from '../channel.ts';
import { type ChannelEmitter, withChannel, withError } from '../channel-emitter.ts';
import type { SessionHistory } from '../session-history.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { checkoutWithFallback, createGit } from '../utils/git.ts';
import { errMsg } from '../utils/helpers.ts';

export function create(
  sessionHistory: SessionHistory,
  rawEventStore: RawEventStore,
  emitter: ChannelEmitter,
): void {
  async function handleStatus(
    ch: Channel,
    _payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const git = createGit(ch.cwd);
      const status = await git.status();
      const changedFiles = status.files.map((f) => ({
        status: `${f.index}${f.working_dir}`.trim(),
        file: f.path,
      }));
      callback?.({ branch: status.current ?? 'unknown', isClean: status.isClean(), changedFiles });
    } catch (err) {
      logger.debug(err, 'Failed to get git status');
      callback?.({ branch: 'unknown', isClean: true, changedFiles: [] });
    }
  }

  async function handleCheckout(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { branch } = gitCheckoutPayloadSchema.parse(payload);
      const git = createGit(ch.cwd);
      await checkoutWithFallback(git, branch);
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
      const { limit } = gitLogPayloadSchema.parse(payload);
      const git = createGit(ch.cwd);
      const log = await git.log({ maxCount: limit ?? 20 });
      const entries = log.all.map((e) => ({
        hash: e.hash,
        message: e.message,
        author: e.author_name,
        date: e.date,
      }));
      callback?.({ entries });
    } catch (err) {
      logger.warn({ err }, 'Failed to get git log');
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
      const git = createGit(ch.cwd);
      const diff = await git.diff();
      callback?.({ diff });
    } catch (err) {
      logger.warn({ err }, 'Failed to get git diff');
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
      const { branch, failed } = gitUpdateSkippedBranchPayloadSchema.parse(payload);
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
      const { command, args } = gitExecPayloadSchema.parse(payload);
      const { stdout, stderr, status } = spawnSync(command, args ?? [], {
        cwd: ch.cwd,
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
