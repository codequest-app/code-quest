import { z } from 'zod';

/** initialize control_response.response shape */
export const controlInitResponseSchema = z
  .object({
    commands: z.array(z.object({ name: z.string() }).passthrough()).optional(),
    models: z.array(z.unknown()).optional(),
    account: z
      .object({
        email: z.string().optional(),
        subscriptionType: z.string().optional(),
        authMethod: z.string().optional(),
        organization: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type ControlInitResponse = z.infer<typeof controlInitResponseSchema>;

/** claude_authenticate control_response.response shape */
export const controlAuthenticateResponseSchema = z
  .object({
    manualUrl: z.string().optional(),
    automaticUrl: z.string().optional(),
  })
  .passthrough();

export type ControlAuthenticateResponse = z.infer<typeof controlAuthenticateResponseSchema>;

/** generate_session_title control_response.response shape */
export const controlGenerateTitleResponseSchema = z
  .object({
    title: z.string(),
  })
  .passthrough();

export type ControlGenerateTitleResponse = z.infer<typeof controlGenerateTitleResponseSchema>;
