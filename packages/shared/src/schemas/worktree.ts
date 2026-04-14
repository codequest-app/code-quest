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
});
export type CreateWorktreePayload = z.infer<typeof createWorktreePayloadSchema>;

export const listWorktreesPayloadSchema = z.object({
  cwd: z.string(),
});
export type ListWorktreesPayload = z.infer<typeof listWorktreesPayloadSchema>;

export const deleteWorktreePayloadSchema = z.object({
  cwd: z.string(),
  name: z.string(),
});
export type DeleteWorktreePayload = z.infer<typeof deleteWorktreePayloadSchema>;

export const createWorktreeResponseSchema = rpcResult(
  z.object({ channelId: z.string(), worktreePath: z.string() }),
);
export type CreateWorktreeResponse = z.infer<typeof createWorktreeResponseSchema>;

export const worktreeListResponseSchema = rpcResult(
  z.object({ worktrees: z.array(worktreeInfoSchema) }),
);
export type WorktreeListResponse = z.infer<typeof worktreeListResponseSchema>;
