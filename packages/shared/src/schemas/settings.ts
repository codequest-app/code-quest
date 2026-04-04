import { z } from 'zod';
import { accountInfoSchema } from './auth.ts';

// ── C2S ──

export const settingsSetPermissionModeSchema = z.object({
  channelId: z.string(),
  mode: z.string(),
});
export type SettingsSetPermissionModePayload = z.infer<typeof settingsSetPermissionModeSchema>;

export const settingsSetModelSchema = z.object({
  channelId: z.string(),
  model: z.string(),
});
export type SettingsSetModelPayload = z.infer<typeof settingsSetModelSchema>;

export const settingsSetThinkingLevelSchema = z.object({
  channelId: z.string(),
  thinkingLevel: z.string(),
});
export type SettingsSetThinkingLevelPayload = z.infer<typeof settingsSetThinkingLevelSchema>;

export const settingsApplySchema = z.object({
  channelId: z.string(),
  settings: z.record(z.string(), z.unknown()),
});
export type SettingsApplyPayload = z.infer<typeof settingsApplySchema>;

export const settingsGetStateSchema = z.object({
  channelId: z.string(),
});
export type SettingsGetStatePayload = z.infer<typeof settingsGetStateSchema>;

// ── State types ──

export const chromeMcpStateSchema = z.object({
  status: z.enum(['disconnected', 'connecting', 'connected', 'error']),
});
export type ChromeMcpState = z.infer<typeof chromeMcpStateSchema>;

export const debuggerMcpStateSchema = z.object({
  status: z.enum(['inactive', 'active', 'error']),
});
export type DebuggerMcpState = z.infer<typeof debuggerMcpStateSchema>;

export const jupyterMcpStateSchema = z.object({
  status: z.enum(['inactive', 'available', 'active']),
});
export type JupyterMcpState = z.infer<typeof jupyterMcpStateSchema>;

export const updateStatePayloadSchema = z.object({
  channelId: z.string(),
  // Global fields
  authStatus: z.enum(['logged_in', 'logged_out', 'unknown']).optional(),
  accountInfo: accountInfoSchema.optional(),
  platform: z.string().optional(),
  speechToTextEnabled: z.boolean().optional(),
  showTerminalBanner: z.boolean().optional(),
  showReviewUpsellBanner: z.boolean().optional(),
  isOnboardingEnabled: z.boolean().optional(),
  isOnboardingDismissed: z.boolean().optional(),
  marketplaceType: z.string().optional(),
  chromeMcpState: chromeMcpStateSchema.optional(),
  debuggerMcpState: debuggerMcpStateSchema.optional(),
  jupyterMcpState: jupyterMcpStateSchema.optional(),
  remoteControlState: z.object({ status: z.string() }).optional(),
  browserIntegrationSupported: z.boolean().optional(),
  experimentGates: z.record(z.string(), z.boolean()).optional(),
  openNewInTab: z.boolean().optional(),
  spinnerVerbsConfig: z.array(z.string()).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  claudeSettings: z.record(z.string(), z.unknown()).optional(),
  // Per-channel fields
  cwd: z.string().optional(),
  modelSetting: z.string().optional(),
  tools: z.array(z.string()).optional(),
  apiKeyStatus: z.string().optional(),
  allowDangerouslySkipPermissions: z.boolean().optional(),
  useCtrlEnterToSend: z.boolean().optional(),
  currentRepo: z.string().nullable().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  // Legacy / both
  defaultCwd: z.string().optional(),
  initialPermissionMode: z.string().optional(),
  thinkingLevel: z.string().optional(),
  mcpServers: z
    .array(z.object({ name: z.string(), status: z.string(), scope: z.string().optional() }))
    .optional(),
  effort: z.string().optional(),
  fastModeState: z.string().optional(),
});
export type UpdateStatePayload = z.infer<typeof updateStatePayloadSchema>;

// ── Quota ──

export const usageQuotaTierSchema = z.object({
  utilization: z.number(),
  resets_at: z.string().optional(),
});
export type UsageQuotaTier = z.infer<typeof usageQuotaTierSchema>;

export const usageQuotaSchema = z.object({
  five_hour: usageQuotaTierSchema.optional(),
  seven_day: usageQuotaTierSchema.optional(),
  seven_day_sonnet: usageQuotaTierSchema.optional(),
  extra_usage: z
    .object({
      is_enabled: z.boolean(),
      monthly_limit: z.number().optional(),
      used_credits: z.number().optional(),
      utilization: z.number().optional(),
      overageStatus: z.string().optional(),
    })
    .optional(),
});
export type UsageQuota = z.infer<typeof usageQuotaSchema>;

// ── Rate limit ──

export const rateLimitInfoSchema = z.object({
  status: z.string(),
  rateLimitType: z.string().optional(),
  resetsAt: z.string().optional(),
  utilization: z.record(z.string(), z.unknown()).optional(),
  overageStatus: z.string().optional(),
  isUsingOverage: z.boolean().optional(),
});
export type RateLimitInfo = z.infer<typeof rateLimitInfoSchema>;

// ── Remote control ──

export const remoteControlStateInfoSchema = z.object({
  state: z.enum(['ready', 'disconnected', 'error']),
  detail: z.string().optional(),
});
export type RemoteControlStateInfo = z.infer<typeof remoteControlStateInfoSchema>;

// ── CLI-initiated settings payloads ──

/** set_model action input */
export const serverActionModelSchema = z.looseObject({ model: z.string() });
export type ServerActionModel = z.infer<typeof serverActionModelSchema>;

/** set_permission_mode action input */
export const serverActionModeSchema = z.looseObject({ mode: z.string() });
export type ServerActionMode = z.infer<typeof serverActionModeSchema>;

/** CLI-initiated settings update (settings:model_updated, settings:permission_mode_updated) */
export const settingsUpdatedPayloadSchema = z.looseObject({
  requestId: z.string(),
  input: z.unknown(),
});
export type SettingsUpdatedPayload = z.infer<typeof settingsUpdatedPayloadSchema>;

// ── State usage (moved from notification.ts) ──

export const stateUsagePayloadSchema = z.object({
  channelId: z.string(),
  usage: usageQuotaSchema,
  contextUsage: z.record(z.string(), z.unknown()).optional(),
});
export type StateUsagePayload = z.infer<typeof stateUsagePayloadSchema>;

export const contextCategorySchema = z.object({
  name: z.string(),
  tokens: z.number(),
  color: z.string(),
});
export type ContextCategory = z.infer<typeof contextCategorySchema>;

export const contextUsageDataSchema = z.object({
  categories: z.array(contextCategorySchema).optional(),
  totalTokens: z.number().optional(),
  maxTokens: z.number().optional(),
  percentage: z.number().optional(),
});
export type ContextUsageData = z.infer<typeof contextUsageDataSchema>;

// ── Settings C2S (moved from control.ts) ──

export const settingsSetProactiveSchema = z.object({
  channelId: z.string(),
  enabled: z.boolean(),
});
export type SettingsSetProactivePayload = z.infer<typeof settingsSetProactiveSchema>;

export const settingsSetRemoteControlSchema = z.object({
  channelId: z.string(),
  enabled: z.boolean(),
});
export type SettingsSetRemoteControlPayload = z.infer<typeof settingsSetRemoteControlSchema>;
