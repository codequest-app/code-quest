import { z } from 'zod';

// ── Auth ──
export const authMethodSchema: z.ZodEnum<{ api_key: 'api_key'; oauth: 'oauth' }> = z.enum([
  'api_key',
  'oauth',
]);
export type AuthMethod = z.infer<typeof authMethodSchema>;

export const loginPayloadSchema: z.ZodObject<
  { method: z.ZodEnum<{ api_key: 'api_key'; oauth: 'oauth' }> },
  z.core.$strip
> = z.object({
  method: authMethodSchema,
});
export type LoginPayload = z.infer<typeof loginPayloadSchema>;

export const oauthCodePayloadSchema: z.ZodObject<
  { code: z.ZodString; state: z.ZodOptional<z.ZodString> },
  z.core.$strip
> = z.object({
  code: z.string(),
  state: z.string().optional(),
});
export type OAuthCodePayload = z.infer<typeof oauthCodePayloadSchema>;

export const authResultSchema: z.ZodObject<
  {
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    authUrl: z.ZodOptional<z.ZodString>;
    auth: z.ZodOptional<z.ZodUnknown>;
  },
  z.core.$strip
> = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  authUrl: z.string().optional(),
  auth: z.unknown().optional(),
});
export type AuthResult = z.infer<typeof authResultSchema>;

export const authStatusSchema: z.ZodObject<
  {
    authenticated: z.ZodBoolean;
    user: z.ZodOptional<
      z.ZodObject<{ name: z.ZodString; email: z.ZodOptional<z.ZodString> }, z.core.$strip>
    >;
    method: z.ZodOptional<z.ZodEnum<{ api_key: 'api_key'; oauth: 'oauth' }>>;
  },
  z.core.$strip
> = z.object({
  authenticated: z.boolean(),
  user: z.object({ name: z.string(), email: z.string().optional() }).optional(),
  method: authMethodSchema.optional(),
});
export type AuthStatus = z.infer<typeof authStatusSchema>;

export const accountInfoSchema: z.ZodObject<
  {
    model: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    subscriptionType: z.ZodOptional<z.ZodString>;
    authMethod: z.ZodOptional<z.ZodString>;
    organization: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = z.object({
  model: z.string().optional(),
  email: z.string().optional(),
  subscriptionType: z.string().optional(),
  authMethod: z.string().optional(),
  organization: z.string().optional(),
});
export type AccountInfo = z.infer<typeof accountInfoSchema>;
