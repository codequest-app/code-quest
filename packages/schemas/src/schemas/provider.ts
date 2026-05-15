import { z } from 'zod';

export const providerClientConfigSchema: z.ZodObject<
  {
    brand: z.ZodObject<
      {
        name: z.ZodString;
        company: z.ZodString;
        docsUrl: z.ZodString;
        placeholder: z.ZodString;
        loginTitle: z.ZodString;
      },
      z.core.$strip
    >;
    permissionModes: z.ZodArray<
      z.ZodObject<{ id: z.ZodString; label: z.ZodString; description: z.ZodString }, z.core.$strip>
    >;
    authMethods: z.ZodArray<z.ZodObject<{ id: z.ZodString; label: z.ZodString }, z.core.$strip>>;
    mcpScopes: z.ZodArray<
      z.ZodObject<
        { id: z.ZodString; label: z.ZodString; prefix: z.ZodOptional<z.ZodString> },
        z.core.$strip
      >
    >;
    usageTiers: z.ZodArray<
      z.ZodObject<{ key: z.ZodString; label: z.ZodString; shortLabel: z.ZodString }, z.core.$strip>
    >;
    defaultModels: z.ZodArray<
      z.ZodObject<
        {
          value: z.ZodString;
          displayName: z.ZodOptional<z.ZodString>;
          description: z.ZodOptional<z.ZodString>;
          supportsEffort: z.ZodOptional<z.ZodBoolean>;
          supportedEffortLevels: z.ZodOptional<z.ZodArray<z.ZodString>>;
          supportsAdaptiveThinking: z.ZodOptional<z.ZodBoolean>;
          supportsFastMode: z.ZodOptional<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
    defaultModelDescription: z.ZodString;
  },
  z.core.$strip
> = z.object({
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

export const getProviderConfigResponseSchema: z.ZodObject<
  {
    providerConfig: z.ZodObject<
      {
        brand: z.ZodObject<
          {
            name: z.ZodString;
            company: z.ZodString;
            docsUrl: z.ZodString;
            placeholder: z.ZodString;
            loginTitle: z.ZodString;
          },
          z.core.$strip
        >;
        permissionModes: z.ZodArray<
          z.ZodObject<
            { id: z.ZodString; label: z.ZodString; description: z.ZodString },
            z.core.$strip
          >
        >;
        authMethods: z.ZodArray<
          z.ZodObject<{ id: z.ZodString; label: z.ZodString }, z.core.$strip>
        >;
        mcpScopes: z.ZodArray<
          z.ZodObject<
            { id: z.ZodString; label: z.ZodString; prefix: z.ZodOptional<z.ZodString> },
            z.core.$strip
          >
        >;
        usageTiers: z.ZodArray<
          z.ZodObject<
            { key: z.ZodString; label: z.ZodString; shortLabel: z.ZodString },
            z.core.$strip
          >
        >;
        defaultModels: z.ZodArray<
          z.ZodObject<
            {
              value: z.ZodString;
              displayName: z.ZodOptional<z.ZodString>;
              description: z.ZodOptional<z.ZodString>;
              supportsEffort: z.ZodOptional<z.ZodBoolean>;
              supportedEffortLevels: z.ZodOptional<z.ZodArray<z.ZodString>>;
              supportsAdaptiveThinking: z.ZodOptional<z.ZodBoolean>;
              supportsFastMode: z.ZodOptional<z.ZodBoolean>;
            },
            z.core.$strip
          >
        >;
        defaultModelDescription: z.ZodString;
      },
      z.core.$strip
    >;
    models: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
    effort: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = z.object({
  providerConfig: providerClientConfigSchema,
  models: z.array(z.unknown()).optional(),
  effort: z.string().optional(),
});
export type GetProviderConfigResponse = z.infer<typeof getProviderConfigResponseSchema>;
