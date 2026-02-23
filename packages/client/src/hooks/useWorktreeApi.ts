type EmitFn = (event: string, data: unknown, callback: (result: { ok: boolean }) => void) => void;

interface WorktreeApi {
  create: (name: string, branch: string) => Promise<{ ok: boolean }>;
  remove: (name: string) => Promise<{ ok: boolean }>;
}

export function createWorktreeApi(emit: EmitFn | null): WorktreeApi | null {
  if (!emit) return null;

  return {
    create: (name: string, branch: string) =>
      new Promise((resolve) => {
        emit('worktree:create', { name, branch }, resolve);
      }),
    remove: (name: string) =>
      new Promise((resolve) => {
        emit('worktree:remove', { name }, resolve);
      }),
  };
}
