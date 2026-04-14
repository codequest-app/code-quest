import {
  createWorktreePayloadSchema,
  deleteWorktreePayloadSchema,
  listWorktreesPayloadSchema,
} from '@code-quest/shared';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';
import { err, ok } from '../utils/rpc.ts';

export function create({
  emitter,
  channelManager,
  gitService,
}: Pick<HandlerContext, 'emitter' | 'channelManager' | 'gitService'>): void {
  async function handleCreate(
    _ch: Channel | null,
    payload: unknown,
    socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    const parsed = createWorktreePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      callback?.(err(parsed.error.message));
      return;
    }
    const { cwd, name } = parsed.data;

    // Use getProjectRoot (main repo), NOT getRepoRoot, to avoid creating
    // a nested worktree when invoked from inside an existing worktree.
    const projectRoot = await gitService.getProjectRoot(cwd).catch(() => null);
    if (!projectRoot) {
      callback?.(err('Not inside a git repository'));
      return;
    }

    let info: Awaited<ReturnType<typeof gitService.createWorktree>> | null = null;
    try {
      info = await gitService.createWorktree(projectRoot, name);
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to create worktree')));
      return;
    }

    const newChannelId = crypto.randomUUID();
    try {
      await channelManager.create(newChannelId, {
        cwd: info.path,
        onBeforeSpawn: (ch) => {
          // Must set before spawn so early broadcastSessionState emits include these.
          ch.projectRoot = projectRoot;
          ch.worktree = { name: info.name, path: info.path, branch: info.branch };
          if (socket) channelManager.addSocketToChannel(ch, socket);
        },
      });

      emitter.broadcastAll('session:created', {
        channelId: newChannelId,
        cwd: info.path,
        projectRoot,
      });

      callback?.(ok({ channelId: newChannelId, worktreePath: info.path }));
    } catch (e) {
      // Rollback the worktree filesystem state on spawn failure.
      try {
        await gitService.deleteWorktree(projectRoot, info.name);
      } catch (rbErr) {
        logger.error({ rbErr }, 'Worktree rollback failed after spawn error');
      }
      callback?.(err(errMsg(e, 'Failed to spawn channel in new worktree')));
    }
  }

  async function handleList(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    const parsed = listWorktreesPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      callback?.(err(parsed.error.message));
      return;
    }
    try {
      const projectRoot = await gitService.getProjectRoot(parsed.data.cwd);
      if (!projectRoot) {
        callback?.(ok({ worktrees: [] }));
        return;
      }
      const worktrees = await gitService.listWorktrees(projectRoot);
      callback?.(ok({ worktrees }));
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to list worktrees')));
    }
  }

  async function handleDelete(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    const parsed = deleteWorktreePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      callback?.(err(parsed.error.message));
      return;
    }
    try {
      const projectRoot = await gitService.getProjectRoot(parsed.data.cwd);
      if (!projectRoot) {
        callback?.(err('Not inside a git repository'));
        return;
      }
      await gitService.deleteWorktree(projectRoot, parsed.data.name);
      callback?.(ok({}));
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to delete worktree')));
    }
  }

  emitter.on('worktree:create', handleCreate);
  emitter.on('worktree:list', handleList);
  emitter.on('worktree:delete', handleDelete);
}
