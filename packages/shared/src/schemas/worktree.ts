import { z } from 'zod';

export const worktreeInfoSchema = z.object({
  name: z.string(),
  path: z.string(),
  branch: z.string().optional(),
});
export type WorktreeInfo = z.infer<typeof worktreeInfoSchema>;

export const createWorktreePayloadSchema = z.object({
  name: z.string().optional(),
});
export type CreateWorktreePayload = z.infer<typeof createWorktreePayloadSchema>;

export const deleteWorktreePayloadSchema = z.object({
  name: z.string(),
});
export type DeleteWorktreePayload = z.infer<typeof deleteWorktreePayloadSchema>;

export const worktreeListResponseSchema = z.object({
  worktrees: z.array(worktreeInfoSchema),
});
export type WorktreeListResponse = z.infer<typeof worktreeListResponseSchema>;
