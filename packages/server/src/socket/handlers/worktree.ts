import {
  createWorktreePayloadSchema,
  deleteWorktreePayloadSchema,
  EVENTS,
  initRepoPayloadSchema,
  listBranchesPayloadSchema,
  listWorktreesPayloadSchema,
  worktreeCheckoutPayloadSchema,
  worktreeStatusPayloadSchema,
} from '@code-quest/shared';
import { AlreadyRepoError, NotARepoError } from '@code-quest/summoner';
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
  // Use getProjectRoot (main repo), NOT getRepoRoot, to avoid creating
  // a nested worktree when invoked from inside an existing worktree.
  const resolveProjectRoot = (cwd: string): Promise<string | null> =>
    gitService.getProjectRoot(cwd).catch(() => null);

  type WorktreeInfo = Awaited<ReturnType<typeof gitService.createWorktree>>;

  async function spawnChannelInWorktree(
    projectRoot: string,
    info: WorktreeInfo,
    socket: TypedSocket | undefined,
  ): Promise<{ channelId: string; worktreePath: string }> {
    const newChannelId = crypto.randomUUID();
    try {
      await channelManager.create(newChannelId, {
        cwd: info.path,
        onBeforeSpawn: (ch) => {
          ch.projectRoot = projectRoot;
          ch.worktree = { name: info.name, path: info.path, branch: info.branch };
          if (socket) channelManager.addSocketToChannel(ch, socket);
        },
      });
      emitter.broadcastAll(EVENTS.session.created, {
        channelId: newChannelId,
        cwd: info.path,
        projectRoot,
      });
      return { channelId: newChannelId, worktreePath: info.path };
    } catch (e) {
      logger.error({ err: e, worktree: info.name }, 'Spawn failed, rolling back worktree');
      try {
        await gitService.deleteWorktree(projectRoot, info.name);
      } catch (rbErr) {
        logger.error({ rbErr }, 'Worktree rollback failed after spawn error');
      }
      throw e;
    }
  }

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
    const { cwd, name, existingBranch, newBranch, baseBranch, path } = parsed.data;

    const projectRoot = await resolveProjectRoot(cwd);
    if (!projectRoot) {
      callback?.(err('Not inside a git repository'));
      return;
    }

    let info: WorktreeInfo;
    try {
      info = await gitService.createWorktree(projectRoot, {
        name,
        existingBranch,
        newBranch,
        baseBranch,
        path,
      });
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to create worktree')));
      return;
    }

    try {
      const result = await spawnChannelInWorktree(projectRoot, info, socket);
      emitter.broadcastAll(EVENTS.worktree.added, { projectCwd: projectRoot, worktree: info });
      callback?.(ok(result));
    } catch (e) {
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
        callback?.(err('not_a_repo'));
        return;
      }
      const worktrees = await gitService.listWorktrees(projectRoot);
      callback?.(ok({ worktrees }));
    } catch (e) {
      if (e instanceof NotARepoError) {
        callback?.(err('not_a_repo'));
        return;
      }
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
      emitter.broadcastAll(EVENTS.worktree.removed, {
        projectCwd: projectRoot,
        name: parsed.data.name,
      });
      callback?.(ok({}));
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to delete worktree')));
    }
  }

  async function handleInitRepo(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    const parsed = initRepoPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      callback?.(err(parsed.error.message));
      return;
    }
    try {
      const res = await gitService.initRepo(parsed.data.cwd);
      emitter.broadcastAll(EVENTS.worktree.added, {
        projectCwd: parsed.data.cwd,
        worktree: { name: 'main', path: parsed.data.cwd, branch: res.branch },
      });
      callback?.(ok({ branch: res.branch }));
    } catch (e) {
      if (e instanceof AlreadyRepoError) {
        callback?.(err('already_a_repo'));
        return;
      }
      callback?.(err(errMsg(e, 'Failed to initialize repo')));
    }
  }

  async function handleListBranches(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    const parsed = listBranchesPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      callback?.(err(parsed.error.message));
      return;
    }
    try {
      const projectRoot = await gitService.getProjectRoot(parsed.data.cwd);
      if (!projectRoot) {
        callback?.(err('not_a_repo'));
        return;
      }
      const branches = await gitService.listBranches(projectRoot);
      callback?.(ok({ branches }));
    } catch (e) {
      if (e instanceof NotARepoError) {
        callback?.(err('not_a_repo'));
        return;
      }
      callback?.(err(errMsg(e, 'Failed to list branches')));
    }
  }

  async function handleCheckout(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    const parsed = worktreeCheckoutPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      callback?.(err(parsed.error.message));
      return;
    }
    const { cwd, branch } = parsed.data;
    try {
      const projectRoot = await gitService.getProjectRoot(cwd);
      if (!projectRoot) {
        callback?.(err('not_a_repo'));
        return;
      }
      await gitService.checkout(cwd, branch);
      emitter.broadcastAll(EVENTS.worktree.branchChanged, {
        projectCwd: projectRoot,
        worktreePath: cwd,
        branch,
      });
      callback?.(ok({ branch }));
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to checkout branch')));
    }
  }

  async function handleStatus(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    const parsed = worktreeStatusPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      callback?.(err(parsed.error.message));
      return;
    }
    try {
      const projectRoot = await gitService.getProjectRoot(parsed.data.cwd);
      if (!projectRoot) {
        callback?.(err('not_a_repo'));
        return;
      }
      const status = await gitService.status(parsed.data.cwd);
      callback?.(
        ok({
          branch: status.branch,
          isClean: status.isClean,
          changedFilesCount: status.changedFiles.length,
        }),
      );
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to get status')));
    }
  }

  emitter.on(EVENTS.worktree.create, handleCreate);
  emitter.on(EVENTS.worktree.list, handleList);
  emitter.on(EVENTS.worktree.delete, handleDelete);
  emitter.on(EVENTS.worktree.initRepo, handleInitRepo);
  emitter.on(EVENTS.worktree.listBranches, handleListBranches);
  emitter.on(EVENTS.worktree.checkout, handleCheckout);
  emitter.on(EVENTS.worktree.status, handleStatus);
}
