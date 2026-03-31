import { z } from 'zod';

/** CLI initialize control_response.response shape */
export const cliInitResponseSchema = z
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

export type CliInitResponse = z.infer<typeof cliInitResponseSchema>;

/** CLI claude_authenticate control_response.response shape */
export const cliAuthenticateResponseSchema = z
  .object({
    manualUrl: z.string().optional(),
    automaticUrl: z.string().optional(),
  })
  .passthrough();

export type CliAuthenticateResponse = z.infer<typeof cliAuthenticateResponseSchema>;

/** CLI generate_session_title control_response.response shape */
export const cliGenerateTitleResponseSchema = z
  .object({
    title: z.string(),
  })
  .passthrough();
