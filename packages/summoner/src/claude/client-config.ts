import { type ProviderClientConfig, providerClientConfigSchema } from '@code-quest/shared';

/**
 * Claude-specific ProviderClientConfig: branding, permission modes, auth methods,
 * MCP scopes, usage tiers, and default models shown in the UI.
 */
export const claudeClientConfig: ProviderClientConfig = providerClientConfigSchema.parse({
  brand: {
    name: 'Claude',
    company: 'Anthropic',
    docsUrl: 'https://docs.anthropic.com/en/docs/claude-code/overview',
    placeholder: '⌘ Esc to focus or unfocus Claude',
    loginTitle: 'Login to Claude',
  },
  permissionModes: [
    {
      id: 'normal',
      label: 'Ask before edits',
      description: 'Claude will ask for approval before making each edit',
    },
    {
      id: 'acceptEdits',
      label: 'Edit automatically',
      description: 'Claude will edit your selected text or the whole file',
    },
    {
      id: 'plan',
      label: 'Plan mode',
      description: 'Claude will explore the code and present a plan before editing',
    },
    {
      id: 'auto',
      label: 'Auto mode',
      description: 'Claude will automatically choose the best permission mode for each task',
    },
    {
      id: 'bypassPermissions',
      label: 'Bypass permissions',
      description: 'Claude will not ask for approval before running potentially dangerous commands',
    },
  ],
  authMethods: [
    { id: 'claudeai', label: 'Claude AI' },
    { id: 'console', label: 'Anthropic Console' },
    { id: 'api-key', label: 'API Key' },
    { id: '3p', label: 'Third Party' },
    { id: 'not-specified', label: 'Not Specified' },
  ],
  mcpScopes: [
    { id: 'project', label: 'Project' },
    { id: 'local', label: 'Local' },
    { id: 'user', label: 'User' },
    { id: 'claudeai', label: 'claude.ai', prefix: 'claude.ai ' },
    { id: 'managed', label: 'Managed' },
    { id: 'enterprise', label: 'Enterprise' },
  ],
  usageTiers: [
    { key: 'five_hour', label: 'Session (5hr)', shortLabel: '5hr' },
    { key: 'seven_day', label: 'Weekly (7 day)', shortLabel: '7day' },
    { key: 'seven_day_sonnet', label: 'Weekly Sonnet', shortLabel: 'Sonnet' },
  ],
  defaultModels: [
    {
      value: 'default',
      displayName: 'Default (recommended)',
      description: 'Opus 4.6 · Most capable for complex work',
      supportsEffort: true,
      supportedEffortLevels: ['low', 'medium', 'high', 'xhigh', 'max'],
      supportsAdaptiveThinking: true,
      supportsFastMode: true,
    },
    {
      value: 'sonnet',
      displayName: 'Sonnet',
      description: 'Sonnet 4.6 · Best for everyday tasks',
      supportsEffort: true,
      supportedEffortLevels: ['low', 'medium', 'high', 'xhigh', 'max'],
      supportsAdaptiveThinking: true,
    },
    {
      value: 'haiku',
      displayName: 'Haiku',
      description: 'Haiku 4.5 · Fastest for quick answers',
    },
  ],
  defaultModelDescription: 'Most capable for complex work',
});
