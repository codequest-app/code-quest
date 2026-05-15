import { z } from 'zod';

export const openspecTaskProgressSchema: z.ZodObject<
  { done: z.ZodNumber; total: z.ZodNumber },
  z.core.$strip
> = z.object({
  done: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});
export type OpenspecTaskProgress = z.infer<typeof openspecTaskProgressSchema>;

export const openspecChangeSummarySchema: z.ZodObject<
  {
    name: z.ZodString;
    tasks: z.ZodNullable<z.ZodObject<{ done: z.ZodNumber; total: z.ZodNumber }, z.core.$strip>>;
    status: z.ZodEnum<{
      'in-progress': 'in-progress';
      complete: 'complete';
      'no-tasks': 'no-tasks';
    }>;
  },
  z.core.$strip
> = z.object({
  name: z.string(),
  /** null = no tasks declared; otherwise CLI-reported task counts. */
  tasks: openspecTaskProgressSchema.nullable(),
  /** As reported by `openspec list --json`. `complete` triggers the Ready
   *  badge. `no-tasks` means the change declares no tasks at all (no
   *  tasks.md or zero checkbox lines). */
  status: z.enum(['in-progress', 'complete', 'no-tasks']),
});
export type OpenspecChangeSummary = z.infer<typeof openspecChangeSummarySchema>;

export const openspecSpecSummarySchema: z.ZodObject<{ capability: z.ZodString }, z.core.$strip> =
  z.object({
    capability: z.string(),
  });
export type OpenspecSpecSummary = z.infer<typeof openspecSpecSummarySchema>;

export const openspecListPayloadSchema: z.ZodObject<{ cwd: z.ZodString }, z.core.$strip> = z.object(
  { cwd: z.string() },
);
export type OpenspecListPayload = z.infer<typeof openspecListPayloadSchema>;

export const openspecListResultSchema: z.ZodUnion<
  readonly [
    z.ZodObject<
      {
        changes: z.ZodArray<
          z.ZodObject<
            {
              name: z.ZodString;
              tasks: z.ZodNullable<
                z.ZodObject<{ done: z.ZodNumber; total: z.ZodNumber }, z.core.$strip>
              >;
              status: z.ZodEnum<{
                'in-progress': 'in-progress';
                complete: 'complete';
                'no-tasks': 'no-tasks';
              }>;
            },
            z.core.$strip
          >
        >;
        specs: z.ZodArray<z.ZodObject<{ capability: z.ZodString }, z.core.$strip>>;
      },
      z.core.$strip
    >,
    z.ZodObject<{ error: z.ZodString }, z.core.$strip>,
  ]
> = z.union([
  z.object({
    changes: z.array(openspecChangeSummarySchema),
    specs: z.array(openspecSpecSummarySchema),
  }),
  z.object({ error: z.string() }),
]);
export type OpenspecListResult = z.infer<typeof openspecListResultSchema>;

export const openspecKindSchema: z.ZodEnum<{ change: 'change'; spec: 'spec' }> = z.enum([
  'change',
  'spec',
]);
export type OpenspecKind = z.infer<typeof openspecKindSchema>;

export const openspecArtifactKindSchema: z.ZodEnum<{
  tasks: 'tasks';
  proposal: 'proposal';
  design: 'design';
  spec: 'spec';
}> = z.enum(['proposal', 'design', 'tasks', 'spec']);
export type OpenspecArtifactKind = z.infer<typeof openspecArtifactKindSchema>;

export const openspecReadPayloadSchema: z.ZodObject<
  {
    cwd: z.ZodString;
    kind: z.ZodEnum<{ spec: 'spec'; change: 'change' }>;
    name: z.ZodString;
    artifact: z.ZodEnum<{ tasks: 'tasks'; proposal: 'proposal'; design: 'design'; spec: 'spec' }>;
  },
  z.core.$strip
> = z.object({
  cwd: z.string(),
  kind: openspecKindSchema,
  name: z.string(),
  artifact: openspecArtifactKindSchema,
});
export type OpenspecReadPayload = z.infer<typeof openspecReadPayloadSchema>;

export const openspecReadResultSchema: z.ZodUnion<
  readonly [
    z.ZodObject<{ content: z.ZodString }, z.core.$strip>,
    z.ZodObject<{ error: z.ZodString }, z.core.$strip>,
  ]
> = z.union([z.object({ content: z.string() }), z.object({ error: z.string() })]);
export type OpenspecReadResult = z.infer<typeof openspecReadResultSchema>;

/** Server → client broadcast: openspec/* file changed in cwd. */
export const openspecDirtyEventSchema: z.ZodObject<
  { cwd: z.ZodString; snapshot: z.ZodOptional<z.ZodUnknown> },
  z.core.$strip
> = z.object({
  cwd: z.string(),
  snapshot: z.unknown().optional(),
});
export type OpenspecDirtyEvent = Omit<z.infer<typeof openspecDirtyEventSchema>, 'snapshot'> & {
  snapshot?: OpenspecListResult;
};

/** Slug accepted by `openspec change new` — lowercase letters, digits, hyphens. */
const openspecChangeSlugSchema: z.ZodString = z.string().regex(/^[a-z0-9-]+$/, {
  message: 'Name must match /^[a-z0-9-]+$/',
});

export const openspecChangeNewPayloadSchema: z.ZodObject<
  { cwd: z.ZodString; name: z.ZodString },
  z.core.$strip
> = z.object({
  cwd: z.string(),
  name: openspecChangeSlugSchema,
});
export type OpenspecChangeNewPayload = z.infer<typeof openspecChangeNewPayloadSchema>;

export const openspecChangeNewResultSchema: z.ZodUnion<
  readonly [
    z.ZodObject<{ ok: z.ZodLiteral<true> }, z.core.$strip>,
    z.ZodObject<{ error: z.ZodString }, z.core.$strip>,
  ]
> = z.union([z.object({ ok: z.literal(true) }), z.object({ error: z.string() })]);
export type OpenspecChangeNewResult = z.infer<typeof openspecChangeNewResultSchema>;

export const openspecArchivePayloadSchema: z.ZodObject<
  { cwd: z.ZodString; name: z.ZodString; skipSpecs: z.ZodOptional<z.ZodBoolean> },
  z.core.$strip
> = z.object({
  cwd: z.string(),
  name: openspecChangeSlugSchema,
  /** When true, passes `--skip-specs` to skip propagating delta specs into
   *  the main `openspec/specs/` tree. Defaults to false so the common
   *  archive-and-sync flow runs by default. */
  skipSpecs: z.boolean().optional(),
});
export type OpenspecArchivePayload = z.infer<typeof openspecArchivePayloadSchema>;

export const openspecArchiveResultSchema: z.ZodUnion<
  readonly [
    z.ZodObject<{ ok: z.ZodLiteral<true> }, z.core.$strip>,
    z.ZodObject<{ error: z.ZodString }, z.core.$strip>,
  ]
> = z.union([z.object({ ok: z.literal(true) }), z.object({ error: z.string() })]);
export type OpenspecArchiveResult = z.infer<typeof openspecArchiveResultSchema>;

export const openspecToggleTaskPayloadSchema: z.ZodObject<
  { cwd: z.ZodString; name: z.ZodString; lineIndex: z.ZodNumber },
  z.core.$strip
> = z.object({
  cwd: z.string(),
  name: openspecChangeSlugSchema,
  /** 0-indexed line number within the change's tasks.md */
  lineIndex: z.number().int().nonnegative(),
});
export type OpenspecToggleTaskPayload = z.infer<typeof openspecToggleTaskPayloadSchema>;

export const openspecToggleTaskResultSchema: z.ZodUnion<
  readonly [
    z.ZodObject<{ ok: z.ZodLiteral<true>; checked: z.ZodBoolean }, z.core.$strip>,
    z.ZodObject<{ error: z.ZodString }, z.core.$strip>,
  ]
> = z.union([
  z.object({ ok: z.literal(true), checked: z.boolean() }),
  z.object({ error: z.string() }),
]);
export type OpenspecToggleTaskResult = z.infer<typeof openspecToggleTaskResultSchema>;
