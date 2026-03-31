import { z } from 'zod';

// ── Auth ──
export const loginPayloadSchema = z.object({
  method: z.enum(['api_key', 'oauth']),
});
export type LoginPayload = z.infer<typeof loginPayloadSchema>;

export const oauthCodePayloadSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});
export type OAuthCodePayload = z.infer<typeof oauthCodePayloadSchema>;

export const authResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  authUrl: z.string().optional(),
  auth: z.unknown().optional(),
});
export type AuthResult = z.infer<typeof authResultSchema>;

export const authStatusSchema = z.object({
  authenticated: z.boolean(),
  user: z.object({ name: z.string(), email: z.string().optional() }).optional(),
  method: z.enum(['api_key', 'oauth']).optional(),
});
export type AuthStatus = z.infer<typeof authStatusSchema>;

export const accountInfoSchema = z.object({
  model: z.string().optional(),
  email: z.string().optional(),
  subscriptionType: z.string().optional(),
  authMethod: z.string().optional(),
  organization: z.string().optional(),
});
export type AccountInfo = z.infer<typeof accountInfoSchema>;
