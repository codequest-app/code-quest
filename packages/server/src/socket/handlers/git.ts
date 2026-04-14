import { gitCheckoutPayloadSchema, gitLogPayloadSchema } from '@code-quest/shared';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import { withChannel } from '../channel-emitter.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';
import { err, ok } from '../utils/rpc.ts';

export function create({
  emitter,
  gitService,
}: Pick<HandlerContext, 'emitter' | 'gitService'>): void {
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
      callback?.(ok({}));
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to checkout')));
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

  emitter.on('git:status', withChannel(handleStatus));
  emitter.on('git:checkout', withChannel(handleCheckout));
  emitter.on('git:log', withChannel(handleLog));
  emitter.on('git:diff', withChannel(handleDiff));
}
