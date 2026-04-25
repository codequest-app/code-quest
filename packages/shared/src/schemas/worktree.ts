import { z } from 'zod';
import { rpcResult } from './rpc.ts';

export const worktreeInfoSchema = z.object({
  name: z.string(),
  path: z.string(),
  branch: z.string().optional(),
});
export type WorktreeInfo = z.infer<typeof worktreeInfoSchema>;

export const createWorktreePayloadSchema = z.object({
  cwd: z.string(),
  name: z.string().optional(),
  /** Tab A: checkout this existing branch. Mutually exclusive with `newBranch`. */
  existingBranch: z.string().optional(),
  /** Tab B: create this new branch. Mutually exclusive with `existingBranch`. */
  newBranch: z.string().optional(),
  /** Tab B: base the new branch on this (defaults to server's default branch). */
  baseBranch: z.string().optional(),
  /** Override auto-derived worktree folder path. */
  path: z.string().optional(),
});
export type CreateWorktreePayload = z.infer<typeof createWorktreePayloadSchema>;

export const listBranchesPayloadSchema = z.object({
  cwd: z.string(),
});
export type ListBranchesPayload = z.infer<typeof listBranchesPayloadSchema>;

export const listBranchesResponseSchema = rpcResult(z.object({ branches: z.array(z.string()) }));
export type ListBranchesResponse = z.infer<typeof listBranchesResponseSchema>;

export const listWorktreesPayloadSchema = z.object({
  cwd: z.string(),
});
export type ListWorktreesPayload = z.infer<typeof listWorktreesPayloadSchema>;

export const deleteWorktreePayloadSchema = z.object({
  cwd: z.string(),
  name: z.string(),
});
export type DeleteWorktreePayload = z.infer<typeof deleteWorktreePayloadSchema>;

export const worktreeRenamePayloadSchema = z.object({
  /** Worktree's own absolute path (NOT main repo cwd). */
  cwd: z.string(),
  newBranchName: z.string().min(1),
});
export type WorktreeRenamePayload = z.infer<typeof worktreeRenamePayloadSchema>;

export const worktreeRenameResponseSchema = rpcResult(z.object({ branch: z.string() }));
export type WorktreeRenameResponse = z.infer<typeof worktreeRenameResponseSchema>;

export const worktreeArchivePayloadSchema = z.object({
  /** Main repo cwd (so simple-git's worktree-remove finds it). */
  projectCwd: z.string(),
  /** Worktree's name (matches `WorktreeInfo.name`). */
  name: z.string(),
  force: z.boolean().optional(),
});
export type WorktreeArchivePayload = z.infer<typeof worktreeArchivePayloadSchema>;

export const worktreeArchiveResponseSchema = z.union([
  z.object({ ok: z.literal(true) }),
  z.object({ error: z.string() }),
]);
export type WorktreeArchiveResponse = z.infer<typeof worktreeArchiveResponseSchema>;

export const createWorktreeResponseSchema = rpcResult(
  z.object({
    worktreePath: z.string(),
    name: z.string(),
    branch: z.string().optional(),
  }),
);
export type CreateWorktreeResponse = z.infer<typeof createWorktreeResponseSchema>;

export const worktreeListResponseSchema = rpcResult(
  z.object({ worktrees: z.array(worktreeInfoSchema) }),
);
export type WorktreeListResponse = z.infer<typeof worktreeListResponseSchema>;

export const initRepoPayloadSchema = z.object({
  cwd: z.string(),
});
export type InitRepoPayload = z.infer<typeof initRepoPayloadSchema>;

export const initRepoResponseSchema = rpcResult(z.object({ branch: z.string() }));
export type InitRepoResponse = z.infer<typeof initRepoResponseSchema>;

export const worktreeAddedEventSchema = z.object({
  projectCwd: z.string(),
  worktree: worktreeInfoSchema,
});
export type WorktreeAddedEvent = z.infer<typeof worktreeAddedEventSchema>;

export const worktreeRemovedEventSchema = z.object({
  projectCwd: z.string(),
  name: z.string(),
});
export type WorktreeRemovedEvent = z.infer<typeof worktreeRemovedEventSchema>;

export const worktreeCheckoutPayloadSchema = z.object({
  cwd: z.string(),
  branch: z.string(),
});
export type WorktreeCheckoutPayload = z.infer<typeof worktreeCheckoutPayloadSchema>;

export const worktreeCheckoutResponseSchema = rpcResult(z.object({ branch: z.string() }));
export type WorktreeCheckoutResponse = z.infer<typeof worktreeCheckoutResponseSchema>;

export const worktreeStatusPayloadSchema = z.object({ cwd: z.string() });
export type WorktreeStatusPayload = z.infer<typeof worktreeStatusPayloadSchema>;

export const worktreeStatusResponseSchema = rpcResult(
  z.object({
    branch: z.string(),
    isClean: z.boolean(),
    changedFilesCount: z.number().int().nonnegative(),
  }),
);
export type WorktreeStatusResponse = z.infer<typeof worktreeStatusResponseSchema>;

export const worktreeBranchChangedEventSchema = z.object({
  projectCwd: z.string(),
  worktreePath: z.string(),
  branch: z.string(),
});
export type WorktreeBranchChangedEvent = z.infer<typeof worktreeBranchChangedEventSchema>;
