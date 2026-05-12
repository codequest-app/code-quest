import type {
  FilesystemService,
  GitService,
  ProcessExitParams,
  ProcessHandle,
  ProcessProvider,
  ProcessStderrParams,
  ProcessStdoutParams,
} from '@code-quest/shared';
import {
  fsBrowseDirectoriesParamsSchema,
  fsBrowseEntriesParamsSchema,
  fsCopyParamsSchema,
  fsCreateParamsSchema,
  fsDeleteParamsSchema,
  fsExistsParamsSchema,
  fsIsDirectoryParamsSchema,
  fsListParamsSchema,
  fsMoveParamsSchema,
  fsReadFileAbsoluteParamsSchema,
  fsReadParamsSchema,
  fsRenameParamsSchema,
  fsStatKindParamsSchema,
  fsWriteFileAbsoluteParamsSchema,
  gitAddParamsSchema,
  gitArchiveWorktreeParamsSchema,
  gitCheckoutParamsSchema,
  gitCommitParamsSchema,
  gitCreateWorktreeParamsSchema,
  gitCwdParamsSchema,
  gitDeleteWorktreeParamsSchema,
  gitDiffParamsSchema,
  gitDiscardFileParamsSchema,
  gitListBranchesParamsSchema,
  gitListWorktreesParamsSchema,
  gitLogParamsSchema,
  gitRenameWorktreeParamsSchema,
  processKillParamsSchema,
  processSpawnParamsSchema,
  processStdinParamsSchema,
  REMOTE_METHODS,
} from '@code-quest/shared';
import type { RpcChannel } from '@code-quest/shared/node';
import { logger } from '../logger.ts';

export class Agent {
  private readonly spawned = new Map<string, ProcessHandle>();
  private readonly rpc: RpcChannel;

  constructor(
    rpc: RpcChannel,
    processProvider: ProcessProvider,
    filesystem: FilesystemService,
    git: GitService,
  ) {
    this.rpc = rpc;
    this.registerProcessHandlers(processProvider);
    this.registerFsHandlers(filesystem);
    this.registerGitHandlers(git);
    this.rpc.on('disconnect', () => this.dispose());
  }

  private registerProcessHandlers(provider: ProcessProvider): void {
    this.rpc.onRequest(REMOTE_METHODS.process.spawn, async (params) => {
      const p = processSpawnParamsSchema.parse(params);
      if (this.spawned.has(p.sessionId)) {
        throw new Error(`sessionId already active: ${p.sessionId}`);
      }
      const handle = provider.spawn(p.command, p.args, {
        cwd: p.cwd,
        env: p.env,
      });
      this.spawned.set(p.sessionId, handle);
      logger.info({ sessionId: p.sessionId }, 'Process spawned');
      void this.streamProcess(p.sessionId, handle);
      return { ok: true };
    });

    this.rpc.onRequest(REMOTE_METHODS.process.stdin, async (params) => {
      const p = processStdinParamsSchema.parse(params);
      this.spawned.get(p.sessionId)?.send(p.data);
      return { ok: true };
    });

    this.rpc.onRequest(REMOTE_METHODS.process.kill, async (params) => {
      const p = processKillParamsSchema.parse(params);
      this.spawned.get(p.sessionId)?.abort();
      this.spawned.delete(p.sessionId);
      logger.info({ sessionId: p.sessionId }, 'Process killed');
      return { ok: true };
    });
  }

  private registerFsHandlers(fs: FilesystemService): void {
    this.rpc.onRequest(REMOTE_METHODS.fs.browseDirectories, async (params) => {
      const p = fsBrowseDirectoriesParamsSchema.parse(params);
      const entries = await fs.browseDirectories(p.path);
      return { entries };
    });

    this.rpc.onRequest(REMOTE_METHODS.fs.browseEntries, async (params) => {
      const p = fsBrowseEntriesParamsSchema.parse(params);
      return fs.browseEntries(p.path, { showHidden: p.showHidden });
    });

    this.rpc.onRequest(REMOTE_METHODS.fs.readFileAbsolute, async (params) => {
      const p = fsReadFileAbsoluteParamsSchema.parse(params);
      return fs.readFileAbsolute(p.absolutePath);
    });

    this.rpc.onRequest(REMOTE_METHODS.fs.writeFileAbsolute, async (params) => {
      const p = fsWriteFileAbsoluteParamsSchema.parse(params);
      return fs.writeFileAbsolute(p.absolutePath, p.content);
    });

    this.rpc.onRequest(REMOTE_METHODS.fs.create, async (params) => {
      const p = fsCreateParamsSchema.parse(params);
      return fs.create(p.absolutePath, p.kind);
    });

    this.rpc.onRequest(REMOTE_METHODS.fs.delete, async (params) => {
      const p = fsDeleteParamsSchema.parse(params);
      return fs.delete(p.absolutePath);
    });

    this.rpc.onRequest(REMOTE_METHODS.fs.rename, async (params) => {
      const p = fsRenameParamsSchema.parse(params);
      return fs.rename(p.from, p.to);
    });

    this.rpc.onRequest(REMOTE_METHODS.fs.copy, async (params) => {
      const p = fsCopyParamsSchema.parse(params);
      return fs.copy(p.from, p.to);
    });

    this.rpc.onRequest(REMOTE_METHODS.fs.move, async (params) => {
      const p = fsMoveParamsSchema.parse(params);
      return fs.move(p.from, p.to);
    });

    this.rpc.onRequest(REMOTE_METHODS.fs.list, async (params) => {
      const p = fsListParamsSchema.parse(params);
      const files = await fs.listFiles(p.cwd, p.pattern);
      return { files };
    });

    this.rpc.onRequest(REMOTE_METHODS.fs.read, async (params) => {
      const p = fsReadParamsSchema.parse(params);
      return fs.readFile(p.cwd, p.filePath);
    });

    this.rpc.onRequest(REMOTE_METHODS.fs.exists, async (params) => {
      const p = fsExistsParamsSchema.parse(params);
      const exists = await fs.exists(p.path);
      return { exists };
    });

    this.rpc.onRequest(REMOTE_METHODS.fs.isDirectory, async (params) => {
      const p = fsIsDirectoryParamsSchema.parse(params);
      const isDirectory = await fs.isDirectory(p.path);
      return { isDirectory };
    });

    this.rpc.onRequest(REMOTE_METHODS.fs.statKind, async (params) => {
      const p = fsStatKindParamsSchema.parse(params);
      const kind = await fs.statKind(p.path);
      return { kind };
    });
  }

  private registerGitHandlers(git: GitService): void {
    this.rpc.onRequest(REMOTE_METHODS.git.status, async (p) =>
      git.status(gitCwdParamsSchema.parse(p).cwd),
    );
    this.rpc.onRequest(REMOTE_METHODS.git.checkout, async (p) => {
      const { cwd, branch } = gitCheckoutParamsSchema.parse(p);
      await git.checkout(cwd, branch);
      return { ok: true };
    });
    this.rpc.onRequest(REMOTE_METHODS.git.log, async (p) => {
      const { cwd, limit } = gitLogParamsSchema.parse(p);
      return git.log(cwd, limit);
    });
    this.rpc.onRequest(REMOTE_METHODS.git.diff, async (p) => {
      const { cwd, filePath, status } = gitDiffParamsSchema.parse(p);
      return git.diff(cwd, filePath, status);
    });
    this.rpc.onRequest(REMOTE_METHODS.git.add, async (p) => {
      const { cwd, paths } = gitAddParamsSchema.parse(p);
      return git.add(cwd, paths);
    });
    this.rpc.onRequest(REMOTE_METHODS.git.commit, async (p) => {
      const { cwd, message } = gitCommitParamsSchema.parse(p);
      return git.commit(cwd, message);
    });
    this.rpc.onRequest(REMOTE_METHODS.git.push, async (p) =>
      git.push(gitCwdParamsSchema.parse(p).cwd),
    );
    this.rpc.onRequest(REMOTE_METHODS.git.fetch, async (p) =>
      git.fetch(gitCwdParamsSchema.parse(p).cwd),
    );
    this.rpc.onRequest(REMOTE_METHODS.git.pull, async (p) =>
      git.pull(gitCwdParamsSchema.parse(p).cwd),
    );
    this.rpc.onRequest(REMOTE_METHODS.git.discardFile, async (p) => {
      const { cwd, file } = gitDiscardFileParamsSchema.parse(p);
      return git.discardFile(cwd, file);
    });
    this.rpc.onRequest(REMOTE_METHODS.git.getRepoRoot, async (p) =>
      git.getRepoRoot(gitCwdParamsSchema.parse(p).cwd),
    );
    this.rpc.onRequest(REMOTE_METHODS.git.getProjectRoot, async (p) =>
      git.getProjectRoot(gitCwdParamsSchema.parse(p).cwd),
    );
    this.rpc.onRequest(REMOTE_METHODS.git.initRepo, async (p) =>
      git.initRepo(gitCwdParamsSchema.parse(p).cwd),
    );
    this.rpc.onRequest(REMOTE_METHODS.git.listBranches, async (p) =>
      git.listBranches(gitListBranchesParamsSchema.parse(p).repoRoot),
    );
    this.rpc.onRequest(REMOTE_METHODS.git.createWorktree, async (p) => {
      const { repoRoot, opts } = gitCreateWorktreeParamsSchema.parse(p);
      return git.createWorktree(repoRoot, opts);
    });
    this.rpc.onRequest(REMOTE_METHODS.git.listWorktrees, async (p) =>
      git.listWorktrees(gitListWorktreesParamsSchema.parse(p).repoRoot),
    );
    this.rpc.onRequest(REMOTE_METHODS.git.deleteWorktree, async (p) => {
      const { repoRoot, name } = gitDeleteWorktreeParamsSchema.parse(p);
      await git.deleteWorktree(repoRoot, name);
      return { ok: true };
    });
    this.rpc.onRequest(REMOTE_METHODS.git.renameWorktree, async (p) => {
      const { worktreeCwd, newBranchName } = gitRenameWorktreeParamsSchema.parse(p);
      return git.renameWorktree(worktreeCwd, newBranchName);
    });
    this.rpc.onRequest(REMOTE_METHODS.git.archiveWorktree, async (p) => {
      const { repoRoot, name, opts } = gitArchiveWorktreeParamsSchema.parse(p);
      return git.archiveWorktree(repoRoot, name, opts);
    });
  }

  dispose(): void {
    for (const handle of this.spawned.values()) {
      handle.abort();
    }
    this.spawned.clear();
    logger.info('Agent disposed');
  }

  private async streamProcess(sessionId: string, handle: ProcessHandle): Promise<void> {
    try {
      if (handle.stderr) {
        void this.streamStderr(sessionId, handle.stderr);
      }
      for await (const line of handle.lines) {
        this.rpc.emit(REMOTE_METHODS.process.stdout, {
          sessionId,
          line,
        } satisfies ProcessStdoutParams);
      }
    } finally {
      this.spawned.delete(sessionId);
      const code = typeof handle.signal.reason === 'number' ? handle.signal.reason : null;
      logger.info({ sessionId }, 'Process exited');
      this.rpc.emit(REMOTE_METHODS.process.exit, { sessionId, code } satisfies ProcessExitParams);
    }
  }

  private async streamStderr(sessionId: string, stderr: AsyncIterable<string>): Promise<void> {
    for await (const line of stderr) {
      this.rpc.emit(REMOTE_METHODS.process.stderr, {
        sessionId,
        line,
      } satisfies ProcessStderrParams);
    }
  }
}
