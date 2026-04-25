import { z } from 'zod';

export const openspecTaskProgressSchema = z.object({
  done: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});
export type OpenspecTaskProgress = z.infer<typeof openspecTaskProgressSchema>;

export const openspecChangeSummarySchema = z.object({
  name: z.string(),
  /** null = no tasks declared; otherwise CLI-reported task counts. */
  tasks: openspecTaskProgressSchema.nullable(),
  /** As reported by `openspec list --json`. `complete` triggers the Ready
   *  badge. `no-tasks` means the change declares no tasks at all (no
   *  tasks.md or zero checkbox lines). */
  status: z.enum(['in-progress', 'complete', 'no-tasks']),
});
export type OpenspecChangeSummary = z.infer<typeof openspecChangeSummarySchema>;

export const openspecSpecSummarySchema = z.object({
  capability: z.string(),
});
export type OpenspecSpecSummary = z.infer<typeof openspecSpecSummarySchema>;

export const openspecListPayloadSchema = z.object({ cwd: z.string() });
export type OpenspecListPayload = z.infer<typeof openspecListPayloadSchema>;

export const openspecListResultSchema = z.union([
  z.object({
    changes: z.array(openspecChangeSummarySchema),
    specs: z.array(openspecSpecSummarySchema),
  }),
  z.object({ error: z.string() }),
]);
export type OpenspecListResult = z.infer<typeof openspecListResultSchema>;

export const openspecArtifactKindSchema = z.enum(['proposal', 'design', 'tasks', 'spec']);
export type OpenspecArtifactKind = z.infer<typeof openspecArtifactKindSchema>;

export const openspecReadPayloadSchema = z.object({
  cwd: z.string(),
  kind: z.enum(['change', 'spec']),
  name: z.string(),
  artifact: openspecArtifactKindSchema,
});
export type OpenspecReadPayload = z.infer<typeof openspecReadPayloadSchema>;

export const openspecReadResultSchema = z.union([
  z.object({ content: z.string() }),
  z.object({ error: z.string() }),
]);
export type OpenspecReadResult = z.infer<typeof openspecReadResultSchema>;

/** Server → client broadcast: openspec/* file changed in cwd. */
export const openspecDirtyEventSchema = z.object({ cwd: z.string() });
export type OpenspecDirtyEvent = z.infer<typeof openspecDirtyEventSchema>;

/** Slug accepted by `openspec change new` — lowercase letters, digits, hyphens. */
export const openspecChangeSlugSchema = z.string().regex(/^[a-z0-9-]+$/, {
  message: 'Name must match /^[a-z0-9-]+$/',
});

export const openspecChangeNewPayloadSchema = z.object({
  cwd: z.string(),
  name: openspecChangeSlugSchema,
});
export type OpenspecChangeNewPayload = z.infer<typeof openspecChangeNewPayloadSchema>;

export const openspecChangeNewResultSchema = z.union([
  z.object({ ok: z.literal(true) }),
  z.object({ error: z.string() }),
]);
export type OpenspecChangeNewResult = z.infer<typeof openspecChangeNewResultSchema>;

export const openspecArchivePayloadSchema = z.object({
  cwd: z.string(),
  name: openspecChangeSlugSchema,
  /** When true, passes `--skip-specs` to skip propagating delta specs into
   *  the main `openspec/specs/` tree. Defaults to false so the common
   *  archive-and-sync flow runs by default. */
  skipSpecs: z.boolean().optional(),
});
export type OpenspecArchivePayload = z.infer<typeof openspecArchivePayloadSchema>;

export const openspecArchiveResultSchema = z.union([
  z.object({ ok: z.literal(true) }),
  z.object({ error: z.string() }),
]);
export type OpenspecArchiveResult = z.infer<typeof openspecArchiveResultSchema>;

export const openspecToggleTaskPayloadSchema = z.object({
  cwd: z.string(),
  name: openspecChangeSlugSchema,
  /** 0-indexed line number within the change's tasks.md */
  lineIndex: z.number().int().nonnegative(),
});
export type OpenspecToggleTaskPayload = z.infer<typeof openspecToggleTaskPayloadSchema>;

export const openspecToggleTaskResultSchema = z.union([
  z.object({ ok: z.literal(true), checked: z.boolean() }),
  z.object({ error: z.string() }),
]);
export type OpenspecToggleTaskResult = z.infer<typeof openspecToggleTaskResultSchema>;
