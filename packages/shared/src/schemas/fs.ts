import { z } from 'zod';
import { rpcResult } from './rpc.ts';

// ── Browse (was explorer:browse) ──

export const fsDirectorySchema: z.ZodObject<
  { name: z.ZodString; path: z.ZodString },
  z.core.$strip
> = z.object({
  name: z.string(),
  path: z.string(),
});
export type FsDirectory = z.infer<typeof fsDirectorySchema>;

export const fsFileSchema: z.ZodObject<{ name: z.ZodString; path: z.ZodString }, z.core.$strip> =
  z.object({
    name: z.string(),
    path: z.string(),
  });
export type FsFile = z.infer<typeof fsFileSchema>;

export const fsBrowsePayloadSchema: z.ZodObject<
  { path: z.ZodOptional<z.ZodString> },
  z.core.$strip
> = z.object({ path: z.string().optional() });
export type FsBrowsePayload = z.infer<typeof fsBrowsePayloadSchema>;

export const fsBrowseResponseSchema: z.ZodUnion<
  readonly [
    z.ZodObject<
      {
        directories: z.ZodArray<
          z.ZodObject<{ name: z.ZodString; path: z.ZodString }, z.core.$strip>
        >;
        files: z.ZodDefault<
          z.ZodArray<z.ZodObject<{ name: z.ZodString; path: z.ZodString }, z.core.$strip>>
        >;
      },
      z.core.$strip
    >,
    z.ZodObject<{ error: z.ZodString }, z.core.$strip>,
  ]
> = z.union([
  z.object({
    directories: z.array(fsDirectorySchema),
    files: z.array(fsFileSchema).default([]),
  }),
  z.object({ error: z.string() }),
]);
export type FsBrowseResponse = z.infer<typeof fsBrowseResponseSchema>;

// ── Read (was explorer:read; replaces channel-scoped file:read) ──

export const fsReadPayloadSchema: z.ZodObject<{ path: z.ZodString }, z.core.$strip> = z.object({
  path: z.string(),
});
export type FsReadPayload = z.infer<typeof fsReadPayloadSchema>;

export const fsReadResponseSchema: z.ZodUnion<
  readonly [
    z.ZodObject<{ content: z.ZodString }, z.core.$strip>,
    z.ZodObject<{ error: z.ZodString }, z.core.$strip>,
  ]
> = z.union([z.object({ content: z.string() }), z.object({ error: z.string() })]);
export type FsReadResponse = z.infer<typeof fsReadResponseSchema>;

// ── Search (was channel-scoped file:list — now cwd-scoped) ──

export const fsSearchPayloadSchema: z.ZodObject<
  { cwd: z.ZodString; pattern: z.ZodString },
  z.core.$strip
> = z.object({
  cwd: z.string(),
  pattern: z.string(),
});
export type FsSearchPayload = z.infer<typeof fsSearchPayloadSchema>;

export const fsSearchResultSchema: z.ZodObject<
  {
    path: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<{ file: 'file'; directory: 'directory' }>;
  },
  z.core.$strip
> = z.object({
  path: z.string(),
  name: z.string(),
  type: z.enum(['file', 'directory']),
});
export type FsSearchResult = z.infer<typeof fsSearchResultSchema>;

export const fsSearchResponseSchema: z.ZodDiscriminatedUnion<
  [
    z.ZodObject<
      {
        ok: z.ZodLiteral<true>;
        data: z.ZodObject<
          {
            files: z.ZodArray<
              z.ZodObject<
                {
                  path: z.ZodString;
                  name: z.ZodString;
                  type: z.ZodEnum<{ file: 'file'; directory: 'directory' }>;
                },
                z.core.$strip
              >
            >;
          },
          z.core.$strip
        >;
      },
      z.core.$strip
    >,
    z.ZodObject<
      { ok: z.ZodLiteral<false>; error: z.ZodString; code: z.ZodOptional<z.ZodString> },
      z.core.$strip
    >,
  ],
  'ok'
> = rpcResult(z.object({ files: z.array(fsSearchResultSchema) }));
export type FsSearchResponse = z.infer<typeof fsSearchResponseSchema>;

// ── Mutations: create / delete / rename / copy / move ──

/** Tagged result reused across all five mutation RPCs. */
export const fsMutationResultSchema: z.ZodUnion<
  readonly [
    z.ZodObject<{ ok: z.ZodLiteral<true> }, z.core.$strip>,
    z.ZodObject<{ error: z.ZodString }, z.core.$strip>,
  ]
> = z.union([z.object({ ok: z.literal(true) }), z.object({ error: z.string() })]);
export type FsMutationResult = z.infer<typeof fsMutationResultSchema>;

export const fsCreatePayloadSchema: z.ZodObject<
  { path: z.ZodString; kind: z.ZodEnum<{ file: 'file'; directory: 'directory' }> },
  z.core.$strip
> = z.object({
  path: z.string(),
  kind: z.enum(['file', 'directory']),
});
export type FsCreatePayload = z.infer<typeof fsCreatePayloadSchema>;

export const fsDeletePayloadSchema: z.ZodObject<{ path: z.ZodString }, z.core.$strip> = z.object({
  path: z.string(),
});
export type FsDeletePayload = z.infer<typeof fsDeletePayloadSchema>;

export const fsRenamePayloadSchema: z.ZodObject<
  { from: z.ZodString; to: z.ZodString },
  z.core.$strip
> = z.object({ from: z.string(), to: z.string() });
export type FsRenamePayload = z.infer<typeof fsRenamePayloadSchema>;

export const fsCopyPayloadSchema: z.ZodObject<
  { from: z.ZodString; to: z.ZodString },
  z.core.$strip
> = z.object({ from: z.string(), to: z.string() });
export type FsCopyPayload = z.infer<typeof fsCopyPayloadSchema>;

export const fsMovePayloadSchema: z.ZodObject<
  { from: z.ZodString; to: z.ZodString },
  z.core.$strip
> = z.object({ from: z.string(), to: z.string() });
export type FsMovePayload = z.infer<typeof fsMovePayloadSchema>;

// ── Watch / unwatch (was explorer:watch / unwatch) ──

export const fsWatchPayloadSchema: z.ZodObject<{ cwd: z.ZodString }, z.core.$strip> = z.object({
  cwd: z.string(),
});
export type FsWatchPayload = z.infer<typeof fsWatchPayloadSchema>;

export const fsUnwatchPayloadSchema: z.ZodObject<{ cwd: z.ZodString }, z.core.$strip> = z.object({
  cwd: z.string(),
});
export type FsUnwatchPayload = z.infer<typeof fsUnwatchPayloadSchema>;
