import { z } from 'zod';

export const projectSchema: z.ZodObject<
  {
    id: z.ZodString;
    path: z.ZodString;
    name: z.ZodString;
    pinned: z.ZodBoolean;
    color: z.ZodNullable<z.ZodString>;
    lastOpenedAt: z.ZodString;
    createdAt: z.ZodString;
  },
  z.core.$strip
> = z.object({
  id: z.string().uuid(),
  path: z.string(),
  name: z.string(),
  pinned: z.boolean(),
  color: z.string().nullable(),
  lastOpenedAt: z.string(),
  createdAt: z.string(),
});
export type Project = z.infer<typeof projectSchema>;

// biome-ignore lint/complexity/noBannedTypes: Zod infers {} for empty object schemas
export const projectsListPayloadSchema: z.ZodOptional<z.ZodObject<{}, z.core.$strip>> = z
  .object({})
  .optional();
export type ProjectsListPayload = z.infer<typeof projectsListPayloadSchema>;

export const projectsListResponseSchema: z.ZodUnion<
  readonly [
    z.ZodObject<
      {
        projects: z.ZodArray<
          z.ZodObject<
            {
              id: z.ZodString;
              path: z.ZodString;
              name: z.ZodString;
              pinned: z.ZodBoolean;
              color: z.ZodNullable<z.ZodString>;
              lastOpenedAt: z.ZodString;
              createdAt: z.ZodString;
            },
            z.core.$strip
          >
        >;
      },
      z.core.$strip
    >,
    z.ZodObject<{ error: z.ZodString }, z.core.$strip>,
  ]
> = z.union([z.object({ projects: z.array(projectSchema) }), z.object({ error: z.string() })]);
export type ProjectsListResponse = z.infer<typeof projectsListResponseSchema>;

export const projectsAddPayloadSchema: z.ZodObject<{ path: z.ZodString }, z.core.$strip> = z.object(
  {
    path: z.string().min(1),
  },
);
export type ProjectsAddPayload = z.infer<typeof projectsAddPayloadSchema>;

export const projectsUpdatePayloadSchema: z.ZodObject<
  {
    id: z.ZodString;
    patch: z.ZodObject<
      {
        name: z.ZodOptional<z.ZodString>;
        pinned: z.ZodOptional<z.ZodBoolean>;
        color: z.ZodOptional<z.ZodNullable<z.ZodString>>;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
> = z.object({
  id: z.string().uuid(),
  patch: z
    .object({
      name: z.string().optional(),
      pinned: z.boolean().optional(),
      color: z.string().nullable().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'patch must have at least one field' }),
});
export type ProjectsUpdatePayload = z.infer<typeof projectsUpdatePayloadSchema>;

export const projectsRemovePayloadSchema: z.ZodObject<{ id: z.ZodString }, z.core.$strip> =
  z.object({
    id: z.string().uuid(),
  });
export type ProjectsRemovePayload = z.infer<typeof projectsRemovePayloadSchema>;

export const projectsErrorSchema: z.ZodObject<
  {
    error: z.ZodEnum<{
      path_not_found: 'path_not_found';
      path_not_directory: 'path_not_directory';
      path_outside_roots: 'path_outside_roots';
      project_not_found: 'project_not_found';
      project_has_active_sessions: 'project_has_active_sessions';
      invalid_payload: 'invalid_payload';
    }>;
    path: z.ZodOptional<z.ZodString>;
    activeSessionCount: z.ZodOptional<z.ZodNumber>;
  },
  z.core.$strip
> = z.object({
  error: z.enum([
    'path_not_found',
    'path_not_directory',
    'path_outside_roots',
    'project_not_found',
    'project_has_active_sessions',
    'invalid_payload',
  ]),
  path: z.string().optional(),
  activeSessionCount: z.number().int().nonnegative().optional(),
});
export type ProjectsError = z.infer<typeof projectsErrorSchema>;

export const projectsAddResponseSchema: z.ZodUnion<
  readonly [
    z.ZodObject<
      {
        id: z.ZodString;
        path: z.ZodString;
        name: z.ZodString;
        pinned: z.ZodBoolean;
        color: z.ZodNullable<z.ZodString>;
        lastOpenedAt: z.ZodString;
        createdAt: z.ZodString;
      },
      z.core.$strip
    >,
    z.ZodObject<
      {
        error: z.ZodEnum<{
          path_not_found: 'path_not_found';
          path_not_directory: 'path_not_directory';
          path_outside_roots: 'path_outside_roots';
          project_not_found: 'project_not_found';
          project_has_active_sessions: 'project_has_active_sessions';
          invalid_payload: 'invalid_payload';
        }>;
        path: z.ZodOptional<z.ZodString>;
        activeSessionCount: z.ZodOptional<z.ZodNumber>;
      },
      z.core.$strip
    >,
  ]
> = z.union([projectSchema, projectsErrorSchema]);
export type ProjectsAddResponse = z.infer<typeof projectsAddResponseSchema>;

export const projectsUpdateResponseSchema: z.ZodUnion<
  readonly [
    z.ZodObject<
      {
        id: z.ZodString;
        path: z.ZodString;
        name: z.ZodString;
        pinned: z.ZodBoolean;
        color: z.ZodNullable<z.ZodString>;
        lastOpenedAt: z.ZodString;
        createdAt: z.ZodString;
      },
      z.core.$strip
    >,
    z.ZodObject<
      {
        error: z.ZodEnum<{
          path_not_found: 'path_not_found';
          path_not_directory: 'path_not_directory';
          path_outside_roots: 'path_outside_roots';
          project_not_found: 'project_not_found';
          project_has_active_sessions: 'project_has_active_sessions';
          invalid_payload: 'invalid_payload';
        }>;
        path: z.ZodOptional<z.ZodString>;
        activeSessionCount: z.ZodOptional<z.ZodNumber>;
      },
      z.core.$strip
    >,
  ]
> = z.union([projectSchema, projectsErrorSchema]);
export type ProjectsUpdateResponse = z.infer<typeof projectsUpdateResponseSchema>;

export const projectsRemoveResponseSchema: z.ZodUnion<
  readonly [
    z.ZodObject<{ ok: z.ZodLiteral<true> }, z.core.$strip>,
    z.ZodObject<
      {
        error: z.ZodEnum<{
          path_not_found: 'path_not_found';
          path_not_directory: 'path_not_directory';
          path_outside_roots: 'path_outside_roots';
          project_not_found: 'project_not_found';
          project_has_active_sessions: 'project_has_active_sessions';
          invalid_payload: 'invalid_payload';
        }>;
        path: z.ZodOptional<z.ZodString>;
        activeSessionCount: z.ZodOptional<z.ZodNumber>;
      },
      z.core.$strip
    >,
  ]
> = z.union([z.object({ ok: z.literal(true) }), projectsErrorSchema]);
export type ProjectsRemoveResponse = z.infer<typeof projectsRemoveResponseSchema>;

export const projectsRemovedEventSchema: z.ZodObject<
  { id: z.ZodString; path: z.ZodString },
  z.core.$strip
> = z.object({
  id: z.string().uuid(),
  path: z.string(),
});
export type ProjectsRemovedEvent = z.infer<typeof projectsRemovedEventSchema>;
