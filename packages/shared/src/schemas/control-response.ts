import { z } from 'zod';

/** initialize control_response.response shape */
export const controlInitResponseSchema = z.looseObject({
  commands: z.array(z.looseObject({ name: z.string() })).optional(),
  models: z.array(z.unknown()).optional(),
  account: z
    .looseObject({
      email: z.string().optional(),
      subscriptionType: z.string().optional(),
      authMethod: z.string().optional(),
      organization: z.string().optional(),
    })
    .optional(),
});

export type ControlInitResponse = z.infer<typeof controlInitResponseSchema>;

/** claude_authenticate control_response.response shape */
export const controlAuthenticateResponseSchema = z.looseObject({
  manualUrl: z.string().optional(),
  automaticUrl: z.string().optional(),
});

export type ControlAuthenticateResponse = z.infer<typeof controlAuthenticateResponseSchema>;

/** generate_session_title control_response.response shape */
export const controlGenerateTitleResponseSchema = z.looseObject({
  title: z.string(),
});

export type ControlGenerateTitleResponse = z.infer<typeof controlGenerateTitleResponseSchema>;
