import { z } from 'zod';

export const providerClientConfigSchema = z.object({
  brand: z.object({
    name: z.string(),
    company: z.string(),
    docsUrl: z.string(),
    placeholder: z.string(),
    loginTitle: z.string(),
  }),
  permissionModes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      description: z.string(),
    }),
  ),
  authMethods: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
    }),
  ),
  mcpScopes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      prefix: z.string().optional(),
    }),
  ),
  usageTiers: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      shortLabel: z.string(),
    }),
  ),
  defaultModels: z.array(
    z.object({
      value: z.string(),
      displayName: z.string().optional(),
      description: z.string().optional(),
      supportsEffort: z.boolean().optional(),
      supportedEffortLevels: z.array(z.string()).optional(),
      supportsAdaptiveThinking: z.boolean().optional(),
      supportsFastMode: z.boolean().optional(),
    }),
  ),
  defaultModelDescription: z.string(),
});

export type ProviderClientConfig = z.infer<typeof providerClientConfigSchema>;

export const getProviderConfigResponseSchema = z.object({
  providerConfig: providerClientConfigSchema,
  models: z.array(z.unknown()).optional(),
  effort: z.string().optional(),
});
export type GetProviderConfigResponse = z.infer<typeof getProviderConfigResponseSchema>;
