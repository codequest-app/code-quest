import { createWorktreePayloadSchema, deleteWorktreePayloadSchema } from '@code-quest/shared';
import {
  createWorktree,
  deleteWorktree,
  getRepoRoot,
  listWorktrees,
} from '../../services/worktree-manager.ts';
import type { Channel } from '../channel.ts';
import type { ChannelEmitter } from '../channel-emitter.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';

export function create(emitter: ChannelEmitter): void {
  async function handleCreate(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const parsed = createWorktreePayloadSchema.safeParse(payload);
      const name = parsed.success ? parsed.data.name : undefined;
      const repoRoot = await getRepoRoot(process.cwd());
      if (!repoRoot) {
        callback?.({ error: 'Not inside a git repository' });
        return;
      }
      const info = await createWorktree(repoRoot, name);
      callback?.(info);
    } catch (err) {
      callback?.({ error: errMsg(err, 'Failed to create worktree') });
    }
  }

  async function handleList(
    _ch: Channel | null,
    _payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const repoRoot = await getRepoRoot(process.cwd());
      if (!repoRoot) {
        callback?.({ worktrees: [] });
        return;
      }
      const worktrees = await listWorktrees(repoRoot);
      callback?.({ worktrees });
    } catch (err) {
      callback?.({ worktrees: [], error: errMsg(err, 'Failed to list worktrees') });
    }
  }

  async function handleDelete(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const parsed = deleteWorktreePayloadSchema.safeParse(payload);
      if (!parsed.success) {
        callback?.({ success: false, error: 'name is required' });
        return;
      }
      const repoRoot = await getRepoRoot(process.cwd());
      if (!repoRoot) {
        callback?.({ success: false, error: 'Not inside a git repository' });
        return;
      }
      await deleteWorktree(repoRoot, parsed.data.name);
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Failed to delete worktree') });
    }
  }

  emitter.on('worktree:create', handleCreate);
  emitter.on('worktree:list', handleList);
  emitter.on('worktree:delete', handleDelete);
}
