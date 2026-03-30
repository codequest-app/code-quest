import { z } from 'zod';
import { accountInfoSchema } from './auth.ts';

// ── C2S ──

export const chatSetPermissionModeSchema = z.object({
  channelId: z.string(),
  mode: z.string(),
});
export type ChatSetPermissionModePayload = z.infer<typeof chatSetPermissionModeSchema>;

export const chatSetModelSchema = z.object({
  channelId: z.string(),
  model: z.string(),
});
export type ChatSetModelPayload = z.infer<typeof chatSetModelSchema>;

export const chatSetThinkingLevelSchema = z.object({
  channelId: z.string(),
  thinkingLevel: z.string(),
});
export type ChatSetThinkingLevelPayload = z.infer<typeof chatSetThinkingLevelSchema>;

export const chatSetFastModeSchema = z.object({
  channelId: z.string(),
  enabled: z.boolean(),
});
export type ChatSetFastModePayload = z.infer<typeof chatSetFastModeSchema>;

export const settingsApplySchema = z.object({
  channelId: z.string(),
  settings: z.record(z.string(), z.unknown()),
});
export type SettingsApplyPayload = z.infer<typeof settingsApplySchema>;

export const chatGetStateSchema = z.object({
  channelId: z.string(),
});
export type ChatGetStatePayload = z.infer<typeof chatGetStateSchema>;

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

export type AuthStatusValue = 'logged_in' | 'logged_out' | 'unknown';

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
