import { createWorktreePayloadSchema, deleteWorktreePayloadSchema } from '@code-quest/shared';
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
  async function handleCreate(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      if (!ch.cwd) {
        callback?.({ error: 'No working directory' });
        return;
      }
      const parsed = createWorktreePayloadSchema.safeParse(payload);
      const name = parsed.success ? parsed.data.name : undefined;
      const repoRoot = await gitService.getRepoRoot(ch.cwd);
      if (!repoRoot) {
        callback?.({ error: 'Not inside a git repository' });
        return;
      }
      const info = await gitService.createWorktree(repoRoot, name);
      callback?.(info);
    } catch (err) {
      callback?.({ error: errMsg(err, 'Failed to create worktree') });
    }
  }

  async function handleList(
    ch: Channel,
    _payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      if (!ch.cwd) {
        callback?.({ worktrees: [] });
        return;
      }
      const repoRoot = await gitService.getRepoRoot(ch.cwd);
      if (!repoRoot) {
        callback?.({ worktrees: [] });
        return;
      }
      const worktrees = await gitService.listWorktrees(repoRoot);
      callback?.({ worktrees });
    } catch (err) {
      callback?.({ worktrees: [], error: errMsg(err, 'Failed to list worktrees') });
    }
  }

  async function handleDelete(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const parsed = deleteWorktreePayloadSchema.safeParse(payload);
      if (!parsed.success) {
        callback?.(err('name is required'));
        return;
      }
      if (!ch.cwd) {
        callback?.(err('No working directory'));
        return;
      }
      const repoRoot = await gitService.getRepoRoot(ch.cwd);
      if (!repoRoot) {
        callback?.(err('Not inside a git repository'));
        return;
      }
      await gitService.deleteWorktree(repoRoot, parsed.data.name);
      callback?.(ok({}));
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to delete worktree')));
    }
  }

  emitter.on('worktree:create', withChannel(handleCreate));
  emitter.on('worktree:list', withChannel(handleList));
  emitter.on('worktree:delete', withChannel(handleDelete));
}
