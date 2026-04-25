import { z } from 'zod';
import { rpcResult } from './rpc.ts';

// ── Browse (was explorer:browse) ──

export const fsDirectorySchema = z.object({
  name: z.string(),
  path: z.string(),
});
export type FsDirectory = z.infer<typeof fsDirectorySchema>;

export const fsFileSchema = z.object({
  name: z.string(),
  path: z.string(),
});
export type FsFile = z.infer<typeof fsFileSchema>;

export const fsBrowsePayloadSchema = z.object({ path: z.string().optional() });
export type FsBrowsePayload = z.infer<typeof fsBrowsePayloadSchema>;

export const fsBrowseResponseSchema = z.union([
  z.object({
    directories: z.array(fsDirectorySchema),
    files: z.array(fsFileSchema).default([]),
  }),
  z.object({ error: z.string() }),
]);
export type FsBrowseResponse = z.infer<typeof fsBrowseResponseSchema>;

// ── Read (was explorer:read; replaces channel-scoped file:read) ──

export const fsReadPayloadSchema = z.object({ path: z.string() });
export type FsReadPayload = z.infer<typeof fsReadPayloadSchema>;

export const fsReadResponseSchema = z.union([
  z.object({ content: z.string() }),
  z.object({ error: z.string() }),
]);
export type FsReadResponse = z.infer<typeof fsReadResponseSchema>;

// ── Search (was channel-scoped file:list — now cwd-scoped) ──

export const fsSearchPayloadSchema = z.object({
  cwd: z.string(),
  pattern: z.string(),
});
export type FsSearchPayload = z.infer<typeof fsSearchPayloadSchema>;

export const fsSearchResultSchema = z.object({
  path: z.string(),
  name: z.string(),
  type: z.enum(['file', 'directory']),
});
export type FsSearchResult = z.infer<typeof fsSearchResultSchema>;

export const fsSearchResponseSchema = rpcResult(z.object({ files: z.array(fsSearchResultSchema) }));
export type FsSearchResponse = z.infer<typeof fsSearchResponseSchema>;

// ── Mutations: create / delete / rename / copy / move ──

/** Tagged result reused across all five mutation RPCs. */
export const fsMutationResultSchema = z.union([
  z.object({ ok: z.literal(true) }),
  z.object({ error: z.string() }),
]);
export type FsMutationResult = z.infer<typeof fsMutationResultSchema>;

export const fsCreatePayloadSchema = z.object({
  path: z.string(),
  kind: z.enum(['file', 'directory']),
});
export type FsCreatePayload = z.infer<typeof fsCreatePayloadSchema>;

export const fsDeletePayloadSchema = z.object({ path: z.string() });
export type FsDeletePayload = z.infer<typeof fsDeletePayloadSchema>;

export const fsRenamePayloadSchema = z.object({ from: z.string(), to: z.string() });
export type FsRenamePayload = z.infer<typeof fsRenamePayloadSchema>;

export const fsCopyPayloadSchema = z.object({ from: z.string(), to: z.string() });
export type FsCopyPayload = z.infer<typeof fsCopyPayloadSchema>;

export const fsMovePayloadSchema = z.object({ from: z.string(), to: z.string() });
export type FsMovePayload = z.infer<typeof fsMovePayloadSchema>;

// ── Watch / unwatch (was explorer:watch / unwatch) ──

export const fsWatchPayloadSchema = z.object({ cwd: z.string() });
export type FsWatchPayload = z.infer<typeof fsWatchPayloadSchema>;

export const fsUnwatchPayloadSchema = z.object({ cwd: z.string() });
export type FsUnwatchPayload = z.infer<typeof fsUnwatchPayloadSchema>;
