import { z } from 'zod';
import { accountInfoSchema } from './auth.ts';

// ── C2S ──

export const settingsSetPermissionModePayloadSchema: z.ZodObject<
  { channelId: z.ZodString; mode: z.ZodString },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  mode: z.string(),
});
export type SettingsSetPermissionModePayload = z.infer<
  typeof settingsSetPermissionModePayloadSchema
>;

export const settingsSetModelPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; model: z.ZodString },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  model: z.string(),
});
export type SettingsSetModelPayload = z.infer<typeof settingsSetModelPayloadSchema>;

export const thinkingDisplaySchema: z.ZodEnum<{ summarized: 'summarized'; omitted: 'omitted' }> =
  z.enum(['summarized', 'omitted']);
export type ThinkingDisplay = z.infer<typeof thinkingDisplaySchema>;

export const settingsSetThinkingLevelPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    thinkingLevel: z.ZodString;
    thinkingDisplay: z.ZodOptional<z.ZodEnum<{ summarized: 'summarized'; omitted: 'omitted' }>>;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  thinkingLevel: z.string(),
  thinkingDisplay: thinkingDisplaySchema.optional(),
});
export type SettingsSetThinkingLevelPayload = z.infer<typeof settingsSetThinkingLevelPayloadSchema>;

export const settingsApplyPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; settings: z.ZodRecord<z.ZodString, z.ZodUnknown> },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  settings: z.record(z.string(), z.unknown()),
});
export type SettingsApplyPayload = z.infer<typeof settingsApplyPayloadSchema>;

export const settingsGetStatePayloadSchema: z.ZodObject<{ channelId: z.ZodString }, z.core.$strip> =
  z.object({
    channelId: z.string(),
  });
export type SettingsGetStatePayload = z.infer<typeof settingsGetStatePayloadSchema>;

// ── State types ──

export const effortLevelSchema: z.ZodEnum<{
  low: 'low';
  medium: 'medium';
  high: 'high';
  xhigh: 'xhigh';
  max: 'max';
}> = z.enum(['low', 'medium', 'high', 'xhigh', 'max']);
export type EffortLevel = z.infer<typeof effortLevelSchema>;

export const chromeMcpStateSchema: z.ZodObject<
  {
    status: z.ZodEnum<{
      error: 'error';
      connected: 'connected';
      disconnected: 'disconnected';
      connecting: 'connecting';
    }>;
  },
  z.core.$strip
> = z.object({
  status: z.enum(['disconnected', 'connecting', 'connected', 'error']),
});
export type ChromeMcpState = z.infer<typeof chromeMcpStateSchema>;

export const debuggerMcpStateSchema: z.ZodObject<
  { status: z.ZodEnum<{ error: 'error'; inactive: 'inactive'; active: 'active' }> },
  z.core.$strip
> = z.object({
  status: z.enum(['inactive', 'active', 'error']),
});
export type DebuggerMcpState = z.infer<typeof debuggerMcpStateSchema>;

export const jupyterMcpStateSchema: z.ZodObject<
  { status: z.ZodEnum<{ available: 'available'; inactive: 'inactive'; active: 'active' }> },
  z.core.$strip
> = z.object({
  status: z.enum(['inactive', 'available', 'active']),
});
export type JupyterMcpState = z.infer<typeof jupyterMcpStateSchema>;

export const updateStatePayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    authStatus: z.ZodOptional<
      z.ZodEnum<{ unknown: 'unknown'; logged_in: 'logged_in'; logged_out: 'logged_out' }>
    >;
    accountInfo: z.ZodOptional<
      z.ZodObject<
        {
          model: z.ZodOptional<z.ZodString>;
          email: z.ZodOptional<z.ZodString>;
          subscriptionType: z.ZodOptional<z.ZodString>;
          authMethod: z.ZodOptional<z.ZodString>;
          organization: z.ZodOptional<z.ZodString>;
        },
        z.core.$strip
      >
    >;
    platform: z.ZodOptional<z.ZodString>;
    speechToTextEnabled: z.ZodOptional<z.ZodBoolean>;
    showTerminalBanner: z.ZodOptional<z.ZodBoolean>;
    showReviewUpsellBanner: z.ZodOptional<z.ZodBoolean>;
    isOnboardingEnabled: z.ZodOptional<z.ZodBoolean>;
    isOnboardingDismissed: z.ZodOptional<z.ZodBoolean>;
    marketplaceType: z.ZodOptional<z.ZodString>;
    chromeMcpState: z.ZodOptional<
      z.ZodObject<
        {
          status: z.ZodEnum<{
            error: 'error';
            connected: 'connected';
            disconnected: 'disconnected';
            connecting: 'connecting';
          }>;
        },
        z.core.$strip
      >
    >;
    debuggerMcpState: z.ZodOptional<
      z.ZodObject<
        { status: z.ZodEnum<{ error: 'error'; inactive: 'inactive'; active: 'active' }> },
        z.core.$strip
      >
    >;
    jupyterMcpState: z.ZodOptional<
      z.ZodObject<
        { status: z.ZodEnum<{ available: 'available'; inactive: 'inactive'; active: 'active' }> },
        z.core.$strip
      >
    >;
    remoteControlState: z.ZodOptional<z.ZodObject<{ status: z.ZodString }, z.core.$strip>>;
    browserIntegrationSupported: z.ZodOptional<z.ZodBoolean>;
    experimentGates: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodBoolean>>;
    openNewInTab: z.ZodOptional<z.ZodBoolean>;
    spinnerVerbsConfig: z.ZodOptional<z.ZodArray<z.ZodString>>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    claudeSettings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    cwd: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    apiKeyStatus: z.ZodOptional<z.ZodString>;
    allowDangerouslySkipPermissions: z.ZodOptional<z.ZodBoolean>;
    useCtrlEnterToSend: z.ZodOptional<z.ZodBoolean>;
    currentRepo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    defaultCwd: z.ZodOptional<z.ZodString>;
    permissionMode: z.ZodOptional<z.ZodString>;
    thinkingLevel: z.ZodOptional<z.ZodString>;
    thinkingDisplay: z.ZodOptional<z.ZodEnum<{ summarized: 'summarized'; omitted: 'omitted' }>>;
    mcpServers: z.ZodOptional<
      z.ZodArray<
        z.ZodObject<
          { name: z.ZodString; status: z.ZodString; scope: z.ZodOptional<z.ZodString> },
          z.core.$strip
        >
      >
    >;
    effort: z.ZodOptional<
      z.ZodEnum<{ low: 'low'; medium: 'medium'; high: 'high'; xhigh: 'xhigh'; max: 'max' }>
    >;
    fastModeState: z.ZodOptional<z.ZodNullable<z.ZodEnum<{ on: 'on'; off: 'off' }>>>;
  },
  z.core.$strip
> = z.object({
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
  model: z.string().optional(),
  tools: z.array(z.string()).optional(),
  apiKeyStatus: z.string().optional(),
  allowDangerouslySkipPermissions: z.boolean().optional(),
  useCtrlEnterToSend: z.boolean().optional(),
  currentRepo: z.string().nullable().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  // Legacy / both
  defaultCwd: z.string().optional(),
  permissionMode: z.string().optional(),
  thinkingLevel: z.string().optional(),
  thinkingDisplay: thinkingDisplaySchema.optional(),
  mcpServers: z
    .array(z.object({ name: z.string(), status: z.string(), scope: z.string().optional() }))
    .optional(),
  effort: effortLevelSchema.optional(),
  fastModeState: z.enum(['on', 'off']).nullable().optional(),
});
export type UpdateStatePayload = z.infer<typeof updateStatePayloadSchema>;

// ── Quota ──

export const usageQuotaTierSchema: z.ZodObject<
  { utilization: z.ZodNumber; resets_at: z.ZodOptional<z.ZodString> },
  z.core.$strip
> = z.object({
  utilization: z.number(),
  resets_at: z.string().optional(),
});
export type UsageQuotaTier = z.infer<typeof usageQuotaTierSchema>;

export const usageQuotaSchema: z.ZodObject<
  {
    five_hour: z.ZodOptional<
      z.ZodObject<
        { utilization: z.ZodNumber; resets_at: z.ZodOptional<z.ZodString> },
        z.core.$strip
      >
    >;
    seven_day: z.ZodOptional<
      z.ZodObject<
        { utilization: z.ZodNumber; resets_at: z.ZodOptional<z.ZodString> },
        z.core.$strip
      >
    >;
    seven_day_sonnet: z.ZodOptional<
      z.ZodObject<
        { utilization: z.ZodNumber; resets_at: z.ZodOptional<z.ZodString> },
        z.core.$strip
      >
    >;
    extra_usage: z.ZodOptional<
      z.ZodObject<
        {
          is_enabled: z.ZodBoolean;
          monthly_limit: z.ZodOptional<z.ZodNumber>;
          used_credits: z.ZodOptional<z.ZodNumber>;
          utilization: z.ZodOptional<z.ZodNumber>;
          overageStatus: z.ZodOptional<z.ZodString>;
        },
        z.core.$strip
      >
    >;
  },
  z.core.$strip
> = z.object({
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

export const rateLimitInfoSchema: z.ZodObject<
  {
    status: z.ZodString;
    rateLimitType: z.ZodOptional<z.ZodString>;
    resetsAt: z.ZodOptional<z.ZodString>;
    utilization: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    overageStatus: z.ZodOptional<z.ZodString>;
    isUsingOverage: z.ZodOptional<z.ZodBoolean>;
  },
  z.core.$strip
> = z.object({
  status: z.string(),
  rateLimitType: z.string().optional(),
  resetsAt: z.string().optional(),
  utilization: z.record(z.string(), z.unknown()).optional(),
  overageStatus: z.string().optional(),
  isUsingOverage: z.boolean().optional(),
});
export type RateLimitInfo = z.infer<typeof rateLimitInfoSchema>;

// ── Remote control ──

export const remoteControlStateInfoSchema: z.ZodObject<
  {
    state: z.ZodEnum<{ error: 'error'; disconnected: 'disconnected'; ready: 'ready' }>;
    detail: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = z.object({
  state: z.enum(['ready', 'disconnected', 'error']),
  detail: z.string().optional(),
});
export type RemoteControlStateInfo = z.infer<typeof remoteControlStateInfoSchema>;

// ── CLI-initiated settings payloads ──

/** set_model action input */
export const serverActionModelSchema: z.ZodObject<{ model: z.ZodString }, z.core.$loose> =
  z.looseObject({ model: z.string() });
export type ServerActionModel = z.infer<typeof serverActionModelSchema>;

/** set_permission_mode action input */
export const serverActionModeSchema: z.ZodObject<{ mode: z.ZodString }, z.core.$loose> =
  z.looseObject({ mode: z.string() });
export type ServerActionMode = z.infer<typeof serverActionModeSchema>;

/** CLI-initiated settings update (settings:model_updated, settings:permission_mode_updated) */
export const settingsUpdatedPayloadSchema: z.ZodObject<
  { requestId: z.ZodString; input: z.ZodUnknown },
  z.core.$loose
> = z.looseObject({
  requestId: z.string(),
  input: z.unknown(),
});
export type SettingsUpdatedPayload = z.infer<typeof settingsUpdatedPayloadSchema>;

// ── State usage (moved from notification.ts) ──

export const stateUsagePayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    usage: z.ZodObject<
      {
        five_hour: z.ZodOptional<
          z.ZodObject<
            { utilization: z.ZodNumber; resets_at: z.ZodOptional<z.ZodString> },
            z.core.$strip
          >
        >;
        seven_day: z.ZodOptional<
          z.ZodObject<
            { utilization: z.ZodNumber; resets_at: z.ZodOptional<z.ZodString> },
            z.core.$strip
          >
        >;
        seven_day_sonnet: z.ZodOptional<
          z.ZodObject<
            { utilization: z.ZodNumber; resets_at: z.ZodOptional<z.ZodString> },
            z.core.$strip
          >
        >;
        extra_usage: z.ZodOptional<
          z.ZodObject<
            {
              is_enabled: z.ZodBoolean;
              monthly_limit: z.ZodOptional<z.ZodNumber>;
              used_credits: z.ZodOptional<z.ZodNumber>;
              utilization: z.ZodOptional<z.ZodNumber>;
              overageStatus: z.ZodOptional<z.ZodString>;
            },
            z.core.$strip
          >
        >;
      },
      z.core.$strip
    >;
    contextUsage: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  usage: usageQuotaSchema,
  contextUsage: z.record(z.string(), z.unknown()).optional(),
});
export type StateUsagePayload = z.infer<typeof stateUsagePayloadSchema>;

export const contextCategorySchema: z.ZodObject<
  { name: z.ZodString; tokens: z.ZodNumber; color: z.ZodString },
  z.core.$strip
> = z.object({
  name: z.string(),
  tokens: z.number(),
  color: z.string(),
});
export type ContextCategory = z.infer<typeof contextCategorySchema>;

export const contextUsageDataSchema: z.ZodObject<
  {
    categories: z.ZodOptional<
      z.ZodArray<
        z.ZodObject<{ name: z.ZodString; tokens: z.ZodNumber; color: z.ZodString }, z.core.$strip>
      >
    >;
    totalTokens: z.ZodOptional<z.ZodNumber>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
    percentage: z.ZodOptional<z.ZodNumber>;
  },
  z.core.$strip
> = z.object({
  categories: z.array(contextCategorySchema).optional(),
  totalTokens: z.number().optional(),
  maxTokens: z.number().optional(),
  percentage: z.number().optional(),
});
export type ContextUsageData = z.infer<typeof contextUsageDataSchema>;

// ── Settings C2S (moved from control.ts) ──

export const settingsSetProactivePayloadSchema: z.ZodObject<
  { channelId: z.ZodString; enabled: z.ZodBoolean },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  enabled: z.boolean(),
});
export type SettingsSetProactivePayload = z.infer<typeof settingsSetProactivePayloadSchema>;

export const settingsSetRemoteControlPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; enabled: z.ZodBoolean },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  enabled: z.boolean(),
});
export type SettingsSetRemoteControlPayload = z.infer<typeof settingsSetRemoteControlPayloadSchema>;
