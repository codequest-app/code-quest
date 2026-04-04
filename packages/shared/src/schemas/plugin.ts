import { z } from 'zod';

// ── C2S ──

export const pluginInstallPayloadSchema = z.object({
  pluginId: z.string(),
  scope: z.enum(['user', 'workspace', 'project', 'local']).optional(),
});
export type PluginInstallPayload = z.infer<typeof pluginInstallPayloadSchema>;

export const pluginTogglePayloadSchema = z.object({ pluginId: z.string(), enabled: z.boolean() });
export type PluginTogglePayload = z.infer<typeof pluginTogglePayloadSchema>;

export const pluginUninstallPayloadSchema = z.object({ pluginId: z.string() });
export type PluginUninstallPayload = z.infer<typeof pluginUninstallPayloadSchema>;

export const addMarketplacePayloadSchema = z.object({ source: z.string().min(1) });
export type AddMarketplacePayload = z.infer<typeof addMarketplacePayloadSchema>;

export const removeMarketplacePayloadSchema = z.object({ marketplaceId: z.string() });
export type RemoveMarketplacePayload = z.infer<typeof removeMarketplacePayloadSchema>;

export const refreshMarketplacePayloadSchema = z.object({ marketplaceId: z.string() });
export type RefreshMarketplacePayload = z.infer<typeof refreshMarketplacePayloadSchema>;

// ── Info schemas ──

export const pluginInfoSchema = z.looseObject({
  id: z.string(),
  version: z.string().optional(),
  scope: z.string().optional(),
  enabled: z.boolean().optional(),
  installPath: z.string().optional(),
  installedAt: z.string().optional(),
  lastUpdated: z.string().optional(),
});
export type PluginInfo = z.infer<typeof pluginInfoSchema>;

export const availablePluginSchema = z.looseObject({
  pluginId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  marketplaceName: z.string().optional(),
  version: z.string().optional(),
  source: z.string().optional(),
  installCount: z.number().optional(),
});
export type AvailablePlugin = z.infer<typeof availablePluginSchema>;

export const marketplaceSourceConfigSchema = z.discriminatedUnion('source', [
  z.object({ source: z.literal('npm'), package: z.string() }),
  z.object({ source: z.literal('github'), repo: z.string() }),
  z.object({ source: z.literal('git'), url: z.string() }),
  z.object({ source: z.literal('url'), url: z.string() }),
  z.object({ source: z.literal('directory'), path: z.string() }),
  z.object({ source: z.literal('file'), path: z.string() }),
  z.object({ source: z.literal('local'), path: z.string() }),
]);
export type MarketplaceSourceConfig = z.infer<typeof marketplaceSourceConfigSchema>;

export const marketplaceInfoSchema = z.object({
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

export const pluginResultSchema = z.object({
  success: z.boolean(),
  needsRestart: z.boolean().optional(),
  error: z.string().optional(),
});
export type PluginResult = z.infer<typeof pluginResultSchema>;

export const marketplaceResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type MarketplaceResult = z.infer<typeof marketplaceResultSchema>;

/** Raw marketplace entry from CLI `marketplace list --json` */
export const marketplaceRawItemSchema = z.object({
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

export const listPluginsPayloadSchema = z.object({ includeAvailable: z.boolean().optional() });
export type ListPluginsPayload = z.infer<typeof listPluginsPayloadSchema>;

export const listPluginsResponseSchema = z.looseObject({
  installed: z.array(pluginInfoSchema),
  available: z.array(availablePluginSchema),
});
export type ListPluginsResponse = z.infer<typeof listPluginsResponseSchema>;

export const listMarketplacesResponseSchema = z.looseObject({
  marketplaces: z.array(marketplaceInfoSchema),
});
export type ListMarketplacesResponse = z.infer<typeof listMarketplacesResponseSchema>;
