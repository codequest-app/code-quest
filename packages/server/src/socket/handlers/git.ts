import {
  gitCheckoutPayloadSchema,
  gitLogPayloadSchema,
  gitUpdateSkippedBranchPayloadSchema,
} from '@code-quest/shared';
import type { RawEntry } from '@code-quest/summoner';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import { withChannel, withError } from '../channel-emitter.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';

export function create({
  sessionHistory,
  rawEventStore,
  emitter,
  gitService,
}: Pick<HandlerContext, 'sessionHistory' | 'rawEventStore' | 'emitter' | 'gitService'>): void {
  async function handleStatus(
    ch: Channel,
    _payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const cwd = ch.cwd;
      const result = await gitService.status(cwd);
      callback?.(result);
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
      const cwd = ch.cwd;
      await gitService.checkout(cwd, branch);
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
      const cwd = ch.cwd;
      const result = await gitService.log(cwd, limit);
      callback?.(result);
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
      const cwd = ch.cwd;
      const result = await gitService.diff(cwd);
      callback?.(result);
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
        sessionId: await sessionHistory.resolveSessionId(ch.channelId),
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

  emitter.on('git:status', withChannel(handleStatus));
  emitter.on('git:checkout', withChannel(handleCheckout));
  emitter.on('git:log', withChannel(handleLog));
  emitter.on('git:diff', withChannel(handleDiff));
  emitter.on('git:update_skipped_branch', withError(withChannel(handleUpdateSkippedBranch)));
}
