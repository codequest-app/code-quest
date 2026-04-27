import {
  createWorktreePayloadSchema,
  EVENTS,
  gitAddPayloadSchema,
  gitCommitPayloadSchema,
  gitDiffByCwdPayloadSchema,
  gitDiscardFilePayloadSchema,
  gitFetchPayloadSchema,
  gitLogPayloadSchema,
  gitPullPayloadSchema,
  gitPushPayloadSchema,
  gitStatusByCwdPayloadSchema,
  initRepoPayloadSchema,
  listBranchesPayloadSchema,
  listWorktreesPayloadSchema,
  worktreeArchivePayloadSchema,
  worktreeCheckoutPayloadSchema,
  worktreeRenamePayloadSchema,
  worktreeStatusPayloadSchema,
} from '@code-quest/shared';
import { AlreadyRepoError, NotARepoError } from '@code-quest/summoner';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';
import { err, ok } from '../utils/rpc.ts';

/**
 * Consolidated git handler — mirrors the `git` CLI:
 *   git init              → git:init
 *   git branch            → git:branches
 *   git checkout          → git:checkout
 *   git status            → git:status (full) / git:statusSummary (cheap)
 *   git diff              → git:diff
 *   git log               → git:log
 *   git add               → git:add (paths? = all)
 *   git commit            → git:commit
 *   git push              → git:push
 *   git worktree list/add/remove → git:worktree:{list,add,remove,rename}
 *
 * All ops are cwd-scoped. Channel-scoped variants were removed (zero callers).
 * Server-side broadcasts (worktree:added / removed / branchChanged) keep their
 * notification-namespace names — they're a separate concern.
 */
export function create({
  emitter,
  gitService,
  filesystemService,
}: Pick<HandlerContext, 'emitter' | 'gitService' | 'filesystemService'>): void {
  const resolveProjectRoot = (cwd: string): Promise<string | null> =>
    gitService.getProjectRoot(cwd).catch(() => null);

  function broadcastDirty(cwd: string): void {
    emitter.broadcastAll(EVENTS.git.dirty, { cwd });
  }

  function ensureWithinRoots(cwd: string, callback?: SocketCallback): boolean {
    if (filesystemService.isWithinRoots(cwd)) return true;
    callback?.({ error: 'Path outside allowed roots' });
    return false;
  }

  // ── git:init ────────────────────────────────────────────────
  emitter.on(
    EVENTS.git.init,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
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
    },
  );

  // ── git:branches ────────────────────────────────────────────
  emitter.on(
    EVENTS.git.branches,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
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
        callback?.(ok({ branches: await gitService.listBranches(projectRoot) }));
      } catch (e) {
        if (e instanceof NotARepoError) {
          callback?.(err('not_a_repo'));
          return;
        }
        callback?.(err(errMsg(e, 'Failed to list branches')));
      }
    },
  );

  // ── git:checkout ────────────────────────────────────────────
  emitter.on(
    EVENTS.git.checkout,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
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
        callback?.(err(errMsg(e, 'Failed to checkout')));
      }
    },
  );

  // ── git:status (full) ───────────────────────────────────────
  emitter.on(
    EVENTS.git.status,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { cwd } = gitStatusByCwdPayloadSchema.parse(payload);
        if (!ensureWithinRoots(cwd, callback)) return;
        callback?.(await gitService.status(cwd));
      } catch (e) {
        if (e instanceof NotARepoError) {
          callback?.({ notARepo: true });
          return;
        }
        callback?.({ error: errMsg(e, 'Status failed') });
      }
    },
  );

  // ── git:statusSummary (sidebar dirty count) ─────────────────
  emitter.on(
    EVENTS.git.statusSummary,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      const parsed = worktreeStatusPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        callback?.(err(parsed.error.message));
        return;
      }
      try {
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
    },
  );

  // ── git:diff ────────────────────────────────────────────────
  emitter.on(
    EVENTS.git.diff,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { cwd } = gitDiffByCwdPayloadSchema.parse(payload);
        if (!ensureWithinRoots(cwd, callback)) return;
        callback?.(await gitService.diff(cwd));
      } catch (e) {
        callback?.({ error: errMsg(e, 'Diff failed') });
      }
    },
  );

  // ── git:log ─────────────────────────────────────────────────
  emitter.on(
    EVENTS.git.log,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { cwd, limit } = gitLogPayloadSchema.parse(payload);
        if (!ensureWithinRoots(cwd, callback)) return;
        callback?.(await gitService.log(cwd, limit));
      } catch (e) {
        logger.warn({ err: e }, 'Failed to get git log');
        callback?.({ error: errMsg(e, 'Failed to get git log') });
      }
    },
  );

  // ── git:add ─────────────────────────────────────────────────
  emitter.on(
    EVENTS.git.add,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { cwd, paths } = gitAddPayloadSchema.parse(payload);
        if (!ensureWithinRoots(cwd, callback)) return;
        const result = await gitService.add(cwd, paths);
        if ('ok' in result) broadcastDirty(cwd);
        callback?.(result);
      } catch (e) {
        callback?.({ error: errMsg(e, 'Add failed') });
      }
    },
  );

  // ── git:commit ──────────────────────────────────────────────
  emitter.on(
    EVENTS.git.commit,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { cwd, message } = gitCommitPayloadSchema.parse(payload);
        if (!ensureWithinRoots(cwd, callback)) return;
        const result = await gitService.commit(cwd, message);
        if ('ok' in result) broadcastDirty(cwd);
        callback?.(result);
      } catch (e) {
        callback?.({ error: errMsg(e, 'Commit failed') });
      }
    },
  );

  // ── git:push ────────────────────────────────────────────────
  emitter.on(
    EVENTS.git.push,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { cwd } = gitPushPayloadSchema.parse(payload);
        if (!ensureWithinRoots(cwd, callback)) return;
        callback?.(await gitService.push(cwd));
      } catch (e) {
        callback?.({ error: errMsg(e, 'Push failed') });
      }
    },
  );

  // ── git:fetch ───────────────────────────────────────────────
  emitter.on(
    EVENTS.git.fetch,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { cwd } = gitFetchPayloadSchema.parse(payload);
        if (!ensureWithinRoots(cwd, callback)) return;
        callback?.(await gitService.fetch(cwd));
      } catch (e) {
        callback?.({ error: errMsg(e, 'Fetch failed') });
      }
    },
  );

  // ── git:pull ────────────────────────────────────────────────
  emitter.on(
    EVENTS.git.pull,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { cwd } = gitPullPayloadSchema.parse(payload);
        if (!ensureWithinRoots(cwd, callback)) return;
        callback?.(await gitService.pull(cwd));
      } catch (e) {
        callback?.({ error: errMsg(e, 'Pull failed') });
      }
    },
  );

  // ── git:discardFile ─────────────────────────────────────────
  emitter.on(
    EVENTS.git.discardFile,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { cwd, file } = gitDiscardFilePayloadSchema.parse(payload);
        if (!ensureWithinRoots(cwd, callback)) return;
        callback?.(await gitService.discardFile(cwd, file));
      } catch (e) {
        callback?.({ error: errMsg(e, 'Discard failed') });
      }
    },
  );

  // ── git:worktree:list ───────────────────────────────────────
  emitter.on(
    EVENTS.git.worktree.list,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
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
        callback?.(ok({ worktrees: await gitService.listWorktrees(projectRoot) }));
      } catch (e) {
        if (e instanceof NotARepoError) {
          callback?.(err('not_a_repo'));
          return;
        }
        callback?.(err(errMsg(e, 'Failed to list worktrees')));
      }
    },
  );

  // ── git:worktree:add (pure git op — no chat session spawn) ──
  emitter.on(
    EVENTS.git.worktree.add,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
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
      try {
        const info = await gitService.createWorktree(projectRoot, {
          name,
          existingBranch,
          newBranch,
          baseBranch,
          path,
        });
        emitter.broadcastAll(EVENTS.worktree.added, { projectCwd: projectRoot, worktree: info });
        callback?.(ok({ worktreePath: info.path, name: info.name, branch: info.branch }));
      } catch (e) {
        callback?.(err(errMsg(e, 'Failed to create worktree')));
      }
    },
  );

  // ── git:worktree:remove (replaces delete + archive) ─────────
  emitter.on(
    EVENTS.git.worktree.remove,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      const parsed = worktreeArchivePayloadSchema.safeParse(payload);
      if (!parsed.success) {
        callback?.({ error: parsed.error.message });
        return;
      }
      try {
        const result = await gitService.archiveWorktree(parsed.data.projectCwd, parsed.data.name, {
          force: parsed.data.force ?? false,
        });
        if ('ok' in result) {
          emitter.broadcastAll(EVENTS.worktree.removed, {
            projectCwd: parsed.data.projectCwd,
            name: parsed.data.name,
          });
        }
        callback?.(result);
      } catch (e) {
        callback?.({ error: errMsg(e, 'Failed to remove worktree') });
      }
    },
  );

  // ── git:worktree:rename ─────────────────────────────────────
  emitter.on(
    EVENTS.git.worktree.rename,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      const parsed = worktreeRenamePayloadSchema.safeParse(payload);
      if (!parsed.success) {
        callback?.(err(parsed.error.message));
        return;
      }
      try {
        const { branch } = await gitService.renameWorktree(
          parsed.data.cwd,
          parsed.data.newBranchName,
        );
        const projectRoot = await gitService.getProjectRoot(parsed.data.cwd);
        if (projectRoot) {
          emitter.broadcastAll(EVENTS.worktree.branchChanged, {
            projectCwd: projectRoot,
            worktreePath: parsed.data.cwd,
            branch,
          });
        }
        callback?.(ok({ branch }));
      } catch (e) {
        callback?.(err(errMsg(e, 'Failed to rename worktree')));
      }
    },
  );
}
