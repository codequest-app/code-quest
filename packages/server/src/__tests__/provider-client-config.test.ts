import { providerClientConfigSchema } from '@code-quest/shared';
import { describe, expect, it } from 'vitest';

describe('providerClientConfigSchema', () => {
  const validConfig = {
    brand: {
      name: 'Claude',
      company: 'Anthropic',
      docsUrl: 'https://docs.anthropic.com',
      placeholder: '⌘ Esc to focus',
      loginTitle: 'Login to Claude',
    },
    permissionModes: [{ id: 'normal', label: 'Normal', description: 'Ask before changes' }],
    authMethods: [{ id: 'claudeai', label: 'Claude AI' }],
    mcpScopes: [
      { id: 'project', label: 'Project' },
      { id: 'claudeai', label: 'claude.ai', prefix: 'claude.ai ' },
    ],
    usageTiers: [{ key: 'five_hour', label: 'Session (5hr)', shortLabel: '5hr' }],
    defaultModels: [{ value: 'default', displayName: 'Default', supportsEffort: true }],
    defaultModelDescription: 'Most capable for complex work',
  };

  it('accepts valid config', () => {
    const result = providerClientConfigSchema.parse(validConfig);
    expect(result.brand.name).toBe('Claude');
    expect(result.permissionModes).toHaveLength(1);
    expect(result.defaultModels).toHaveLength(1);
  });

  it('rejects missing brand', () => {
    const { brand: _, ...noName } = validConfig;
    expect(() => providerClientConfigSchema.parse(noName)).toThrow();
  });

  it('accepts empty arrays', () => {
    const minimal = {
      ...validConfig,
      permissionModes: [],
      authMethods: [],
      mcpScopes: [],
      usageTiers: [],
      defaultModels: [],
    };
    expect(providerClientConfigSchema.parse(minimal)).toBeDefined();
  });

  it('mcpScopes prefix is optional', () => {
    const config = {
      ...validConfig,
      mcpScopes: [{ id: 'project', label: 'Project' }],
    };
    const result = providerClientConfigSchema.parse(config);
    expect(result.mcpScopes[0]!.prefix).toBeUndefined();
  });

  it('defaultModels fields are optional except value', () => {
    const config = {
      ...validConfig,
      defaultModels: [{ value: 'haiku' }],
    };
    const result = providerClientConfigSchema.parse(config);
    expect(result.defaultModels[0]!.displayName).toBeUndefined();
    expect(result.defaultModels[0]!.supportsEffort).toBeUndefined();
  });
});
