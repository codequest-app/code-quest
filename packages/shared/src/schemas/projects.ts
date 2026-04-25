import { z } from 'zod';

export const projectSchema = z.object({
  id: z.string().uuid(),
  path: z.string(),
  name: z.string(),
  pinned: z.boolean(),
  color: z.string().nullable(),
  lastOpenedAt: z.string(),
  createdAt: z.string(),
});
export type Project = z.infer<typeof projectSchema>;

export const projectsListPayloadSchema = z.object({}).optional();
export type ProjectsListPayload = z.infer<typeof projectsListPayloadSchema>;

export const projectsListResponseSchema = z.union([
  z.object({ projects: z.array(projectSchema) }),
  z.object({ error: z.string() }),
]);
export type ProjectsListResponse = z.infer<typeof projectsListResponseSchema>;

export const projectsAddPayloadSchema = z.object({
  path: z.string().min(1),
});
export type ProjectsAddPayload = z.infer<typeof projectsAddPayloadSchema>;

export const projectsUpdatePayloadSchema = z.object({
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

export const projectsRemovePayloadSchema = z.object({
  id: z.string().uuid(),
});
export type ProjectsRemovePayload = z.infer<typeof projectsRemovePayloadSchema>;

export const projectsErrorSchema = z.object({
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

export const projectsAddResponseSchema = z.union([projectSchema, projectsErrorSchema]);
export type ProjectsAddResponse = z.infer<typeof projectsAddResponseSchema>;

export const projectsUpdateResponseSchema = z.union([projectSchema, projectsErrorSchema]);
export type ProjectsUpdateResponse = z.infer<typeof projectsUpdateResponseSchema>;

export const projectsRemoveResponseSchema = z.union([
  z.object({ ok: z.literal(true) }),
  projectsErrorSchema,
]);
export type ProjectsRemoveResponse = z.infer<typeof projectsRemoveResponseSchema>;

export const projectsRemovedEventSchema = z.object({
  id: z.string().uuid(),
  path: z.string(),
});
export type ProjectsRemovedEvent = z.infer<typeof projectsRemovedEventSchema>;
