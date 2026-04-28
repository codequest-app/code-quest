import { z } from 'zod';

// ── C2S ──

export const pluginInstallPayloadSchema: z.ZodObject<
  {
    pluginId: z.ZodString;
    scope: z.ZodOptional<
      z.ZodEnum<{ user: 'user'; workspace: 'workspace'; project: 'project'; local: 'local' }>
    >;
  },
  z.core.$strip
> = z.object({
  pluginId: z.string(),
  scope: z.enum(['user', 'workspace', 'project', 'local']).optional(),
});
export type PluginInstallPayload = z.infer<typeof pluginInstallPayloadSchema>;

export const pluginTogglePayloadSchema: z.ZodObject<
  { pluginId: z.ZodString; enabled: z.ZodBoolean },
  z.core.$strip
> = z.object({ pluginId: z.string(), enabled: z.boolean() });
export type PluginTogglePayload = z.infer<typeof pluginTogglePayloadSchema>;

export const pluginUninstallPayloadSchema: z.ZodObject<{ pluginId: z.ZodString }, z.core.$strip> =
  z.object({ pluginId: z.string() });
export type PluginUninstallPayload = z.infer<typeof pluginUninstallPayloadSchema>;

export const addMarketplacePayloadSchema: z.ZodObject<{ source: z.ZodString }, z.core.$strip> =
  z.object({ source: z.string().min(1) });
export type AddMarketplacePayload = z.infer<typeof addMarketplacePayloadSchema>;

export const removeMarketplacePayloadSchema: z.ZodObject<
  { marketplaceId: z.ZodString },
  z.core.$strip
> = z.object({ marketplaceId: z.string() });
export type RemoveMarketplacePayload = z.infer<typeof removeMarketplacePayloadSchema>;

export const refreshMarketplacePayloadSchema: z.ZodObject<
  { marketplaceId: z.ZodString },
  z.core.$strip
> = z.object({ marketplaceId: z.string() });
export type RefreshMarketplacePayload = z.infer<typeof refreshMarketplacePayloadSchema>;

// ── Info schemas ──

export const pluginInfoSchema: z.ZodObject<
  {
    id: z.ZodString;
    version: z.ZodOptional<z.ZodString>;
    scope: z.ZodOptional<z.ZodString>;
    enabled: z.ZodOptional<z.ZodBoolean>;
    installPath: z.ZodOptional<z.ZodString>;
    installedAt: z.ZodOptional<z.ZodString>;
    lastUpdated: z.ZodOptional<z.ZodString>;
  },
  z.core.$loose
> = z.looseObject({
  id: z.string(),
  version: z.string().optional(),
  scope: z.string().optional(),
  enabled: z.boolean().optional(),
  installPath: z.string().optional(),
  installedAt: z.string().optional(),
  lastUpdated: z.string().optional(),
});
export type PluginInfo = z.infer<typeof pluginInfoSchema>;

export const marketplaceSourceConfigSchema: z.ZodDiscriminatedUnion<
  [
    z.ZodObject<{ source: z.ZodLiteral<'npm'>; package: z.ZodString }, z.core.$strip>,
    z.ZodObject<{ source: z.ZodLiteral<'github'>; repo: z.ZodString }, z.core.$strip>,
    z.ZodObject<{ source: z.ZodLiteral<'git'>; url: z.ZodString }, z.core.$strip>,
    z.ZodObject<
      {
        source: z.ZodLiteral<'git-subdir'>;
        url: z.ZodString;
        path: z.ZodString;
        ref: z.ZodOptional<z.ZodString>;
        sha: z.ZodOptional<z.ZodString>;
      },
      z.core.$strip
    >,
    z.ZodObject<{ source: z.ZodLiteral<'url'>; url: z.ZodString }, z.core.$strip>,
    z.ZodObject<{ source: z.ZodLiteral<'directory'>; path: z.ZodString }, z.core.$strip>,
    z.ZodObject<{ source: z.ZodLiteral<'file'>; path: z.ZodString }, z.core.$strip>,
    z.ZodObject<{ source: z.ZodLiteral<'local'>; path: z.ZodString }, z.core.$strip>,
  ],
  'source'
> = z.discriminatedUnion('source', [
  z.object({ source: z.literal('npm'), package: z.string() }),
  z.object({ source: z.literal('github'), repo: z.string() }),
  z.object({ source: z.literal('git'), url: z.string() }),
  z.object({
    source: z.literal('git-subdir'),
    url: z.string(),
    path: z.string(),
    ref: z.string().optional(),
    sha: z.string().optional(),
  }),
  z.object({ source: z.literal('url'), url: z.string() }),
  z.object({ source: z.literal('directory'), path: z.string() }),
  z.object({ source: z.literal('file'), path: z.string() }),
  z.object({ source: z.literal('local'), path: z.string() }),
]);
export type MarketplaceSourceConfig = z.infer<typeof marketplaceSourceConfigSchema>;

export const availablePluginSchema: z.ZodObject<
  {
    pluginId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    marketplaceName: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<
      z.ZodUnion<
        readonly [
          z.ZodDiscriminatedUnion<
            [
              z.ZodObject<{ source: z.ZodLiteral<'npm'>; package: z.ZodString }, z.core.$strip>,
              z.ZodObject<{ source: z.ZodLiteral<'github'>; repo: z.ZodString }, z.core.$strip>,
              z.ZodObject<{ source: z.ZodLiteral<'git'>; url: z.ZodString }, z.core.$strip>,
              z.ZodObject<
                {
                  source: z.ZodLiteral<'git-subdir'>;
                  url: z.ZodString;
                  path: z.ZodString;
                  ref: z.ZodOptional<z.ZodString>;
                  sha: z.ZodOptional<z.ZodString>;
                },
                z.core.$strip
              >,
              z.ZodObject<{ source: z.ZodLiteral<'url'>; url: z.ZodString }, z.core.$strip>,
              z.ZodObject<{ source: z.ZodLiteral<'directory'>; path: z.ZodString }, z.core.$strip>,
              z.ZodObject<{ source: z.ZodLiteral<'file'>; path: z.ZodString }, z.core.$strip>,
              z.ZodObject<{ source: z.ZodLiteral<'local'>; path: z.ZodString }, z.core.$strip>,
            ],
            'source'
          >,
          z.ZodString,
        ]
      >
    >;
    installCount: z.ZodOptional<z.ZodNumber>;
  },
  z.core.$loose
> = z.looseObject({
  pluginId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  marketplaceName: z.string().optional(),
  version: z.string().optional(),
  source: z.union([marketplaceSourceConfigSchema, z.string()]).optional(),
  installCount: z.number().optional(),
});
export type AvailablePlugin = z.infer<typeof availablePluginSchema>;

export const marketplaceInfoSchema: z.ZodObject<
  {
    name: z.ZodString;
    config: z.ZodObject<
      {
        source: z.ZodDiscriminatedUnion<
          [
            z.ZodObject<{ source: z.ZodLiteral<'npm'>; package: z.ZodString }, z.core.$strip>,
            z.ZodObject<{ source: z.ZodLiteral<'github'>; repo: z.ZodString }, z.core.$strip>,
            z.ZodObject<{ source: z.ZodLiteral<'git'>; url: z.ZodString }, z.core.$strip>,
            z.ZodObject<
              {
                source: z.ZodLiteral<'git-subdir'>;
                url: z.ZodString;
                path: z.ZodString;
                ref: z.ZodOptional<z.ZodString>;
                sha: z.ZodOptional<z.ZodString>;
              },
              z.core.$strip
            >,
            z.ZodObject<{ source: z.ZodLiteral<'url'>; url: z.ZodString }, z.core.$strip>,
            z.ZodObject<{ source: z.ZodLiteral<'directory'>; path: z.ZodString }, z.core.$strip>,
            z.ZodObject<{ source: z.ZodLiteral<'file'>; path: z.ZodString }, z.core.$strip>,
            z.ZodObject<{ source: z.ZodLiteral<'local'>; path: z.ZodString }, z.core.$strip>,
          ],
          'source'
        >;
        installLocation: z.ZodString;
      },
      z.core.$strip
    >;
    pluginCount: z.ZodNumber;
    installedCount: z.ZodNumber;
  },
  z.core.$strip
> = z.object({
  name: z.string(),
  config: z.object({
    source: marketplaceSourceConfigSchema,
    installLocation: z.string(),
  }),
  pluginCount: z.number(),
  installedCount: z.number(),
});
export type MarketplaceInfo = z.infer<typeof marketplaceInfoSchema>;

// ── Results ──

export const pluginResultSchema: z.ZodObject<
  {
    success: z.ZodBoolean;
    needsRestart: z.ZodOptional<z.ZodBoolean>;
    error: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = z.object({
  success: z.boolean(),
  needsRestart: z.boolean().optional(),
  error: z.string().optional(),
});
export type PluginResult = z.infer<typeof pluginResultSchema>;

export const marketplaceResultSchema: z.ZodObject<
  { success: z.ZodBoolean; error: z.ZodOptional<z.ZodString> },
  z.core.$strip
> = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type MarketplaceResult = z.infer<typeof marketplaceResultSchema>;

/** Raw marketplace entry from CLI `marketplace list --json` */
export const marketplaceRawItemSchema: z.ZodObject<
  {
    name: z.ZodString;
    source: z.ZodString;
    repo: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    path: z.ZodOptional<z.ZodString>;
    package: z.ZodOptional<z.ZodString>;
    installLocation: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = z.object({
  name: z.string(),
  source: z.string(),
  repo: z.string().optional(),
  url: z.string().optional(),
  path: z.string().optional(),
  package: z.string().optional(),
  installLocation: z.string().optional(),
});
export type MarketplaceRawItem = z.infer<typeof marketplaceRawItemSchema>;

// ── Response schemas ──

export const pluginReloadRequestPayloadSchema: z.ZodObject<
  { channelId: z.ZodString },
  z.core.$strip
> = z.object({ channelId: z.string() });
export type PluginReloadRequestPayload = z.infer<typeof pluginReloadRequestPayloadSchema>;

export const pluginReloadPayloadSchema: z.ZodObject<
  {
    commands: z.ZodOptional<
      z.ZodArray<
        z.ZodObject<
          {
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            argumentHint: z.ZodOptional<z.ZodString>;
          },
          z.core.$strip
        >
      >
    >;
    agents: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
    plugins: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
    mcpServers: z.ZodOptional<
      z.ZodArray<
        z.ZodObject<
          { name: z.ZodString; status: z.ZodString; scope: z.ZodOptional<z.ZodString> },
          z.core.$strip
        >
      >
    >;
  },
  z.core.$strip
> = z.object({
  commands: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        argumentHint: z.string().optional(),
      }),
    )
    .optional(),
  agents: z.array(z.unknown()).optional(),
  plugins: z.array(z.unknown()).optional(),
  mcpServers: z
    .array(z.object({ name: z.string(), status: z.string(), scope: z.string().optional() }))
    .optional(),
});
export type PluginReloadPayload = z.infer<typeof pluginReloadPayloadSchema>;

export const pluginReloadResultSchema: z.ZodObject<
  {
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    data: z.ZodOptional<
      z.ZodObject<
        {
          commands: z.ZodOptional<
            z.ZodArray<
              z.ZodObject<
                {
                  name: z.ZodString;
                  description: z.ZodOptional<z.ZodString>;
                  argumentHint: z.ZodOptional<z.ZodString>;
                },
                z.core.$strip
              >
            >
          >;
          agents: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
          plugins: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
          mcpServers: z.ZodOptional<
            z.ZodArray<
              z.ZodObject<
                { name: z.ZodString; status: z.ZodString; scope: z.ZodOptional<z.ZodString> },
                z.core.$strip
              >
            >
          >;
        },
        z.core.$strip
      >
    >;
  },
  z.core.$strip
> = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  data: pluginReloadPayloadSchema.optional(),
});
export type PluginReloadResult = z.infer<typeof pluginReloadResultSchema>;

export const listPluginsPayloadSchema: z.ZodObject<
  { includeAvailable: z.ZodOptional<z.ZodBoolean> },
  z.core.$strip
> = z.object({ includeAvailable: z.boolean().optional() });
export type ListPluginsPayload = z.infer<typeof listPluginsPayloadSchema>;

export const listPluginsResponseSchema: z.ZodObject<
  {
    installed: z.ZodArray<
      z.ZodObject<
        {
          id: z.ZodString;
          version: z.ZodOptional<z.ZodString>;
          scope: z.ZodOptional<z.ZodString>;
          enabled: z.ZodOptional<z.ZodBoolean>;
          installPath: z.ZodOptional<z.ZodString>;
          installedAt: z.ZodOptional<z.ZodString>;
          lastUpdated: z.ZodOptional<z.ZodString>;
        },
        z.core.$loose
      >
    >;
    available: z.ZodArray<
      z.ZodObject<
        {
          pluginId: z.ZodString;
          name: z.ZodString;
          description: z.ZodOptional<z.ZodString>;
          marketplaceName: z.ZodOptional<z.ZodString>;
          version: z.ZodOptional<z.ZodString>;
          source: z.ZodOptional<
            z.ZodUnion<
              readonly [
                z.ZodDiscriminatedUnion<
                  [
                    z.ZodObject<
                      { source: z.ZodLiteral<'npm'>; package: z.ZodString },
                      z.core.$strip
                    >,
                    z.ZodObject<
                      { source: z.ZodLiteral<'github'>; repo: z.ZodString },
                      z.core.$strip
                    >,
                    z.ZodObject<{ source: z.ZodLiteral<'git'>; url: z.ZodString }, z.core.$strip>,
                    z.ZodObject<
                      {
                        source: z.ZodLiteral<'git-subdir'>;
                        url: z.ZodString;
                        path: z.ZodString;
                        ref: z.ZodOptional<z.ZodString>;
                        sha: z.ZodOptional<z.ZodString>;
                      },
                      z.core.$strip
                    >,
                    z.ZodObject<{ source: z.ZodLiteral<'url'>; url: z.ZodString }, z.core.$strip>,
                    z.ZodObject<
                      { source: z.ZodLiteral<'directory'>; path: z.ZodString },
                      z.core.$strip
                    >,
                    z.ZodObject<{ source: z.ZodLiteral<'file'>; path: z.ZodString }, z.core.$strip>,
                    z.ZodObject<
                      { source: z.ZodLiteral<'local'>; path: z.ZodString },
                      z.core.$strip
                    >,
                  ],
                  'source'
                >,
                z.ZodString,
              ]
            >
          >;
          installCount: z.ZodOptional<z.ZodNumber>;
        },
        z.core.$loose
      >
    >;
  },
  z.core.$loose
> = z.looseObject({
  installed: z.array(pluginInfoSchema),
  available: z.array(availablePluginSchema),
});
export type ListPluginsResponse = z.infer<typeof listPluginsResponseSchema>;

export const listMarketplacesResponseSchema: z.ZodObject<
  {
    marketplaces: z.ZodArray<
      z.ZodObject<
        {
          name: z.ZodString;
          config: z.ZodObject<
            {
              source: z.ZodDiscriminatedUnion<
                [
                  z.ZodObject<{ source: z.ZodLiteral<'npm'>; package: z.ZodString }, z.core.$strip>,
                  z.ZodObject<{ source: z.ZodLiteral<'github'>; repo: z.ZodString }, z.core.$strip>,
                  z.ZodObject<{ source: z.ZodLiteral<'git'>; url: z.ZodString }, z.core.$strip>,
                  z.ZodObject<
                    {
                      source: z.ZodLiteral<'git-subdir'>;
                      url: z.ZodString;
                      path: z.ZodString;
                      ref: z.ZodOptional<z.ZodString>;
                      sha: z.ZodOptional<z.ZodString>;
                    },
                    z.core.$strip
                  >,
                  z.ZodObject<{ source: z.ZodLiteral<'url'>; url: z.ZodString }, z.core.$strip>,
                  z.ZodObject<
                    { source: z.ZodLiteral<'directory'>; path: z.ZodString },
                    z.core.$strip
                  >,
                  z.ZodObject<{ source: z.ZodLiteral<'file'>; path: z.ZodString }, z.core.$strip>,
                  z.ZodObject<{ source: z.ZodLiteral<'local'>; path: z.ZodString }, z.core.$strip>,
                ],
                'source'
              >;
              installLocation: z.ZodString;
            },
            z.core.$strip
          >;
          pluginCount: z.ZodNumber;
          installedCount: z.ZodNumber;
        },
        z.core.$strip
      >
    >;
  },
  z.core.$loose
> = z.looseObject({
  marketplaces: z.array(marketplaceInfoSchema),
});
export type ListMarketplacesResponse = z.infer<typeof listMarketplacesResponseSchema>;
