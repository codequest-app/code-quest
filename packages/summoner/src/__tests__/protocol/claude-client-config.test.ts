import { providerClientConfigSchema } from '@code-quest/shared';
import { describe, expect, it } from 'vitest';
import { ClaudeAdapter } from '../../protocol/claude-adapter.ts';

describe('ClaudeAdapter.clientConfig', () => {
  const adapter = new ClaudeAdapter();

  it('has clientConfig property', () => {
    expect(adapter.clientConfig).toBeDefined();
  });

  it('passes Zod schema validation', () => {
    expect(() => providerClientConfigSchema.parse(adapter.clientConfig)).not.toThrow();
  });

  it('brand.name is Claude', () => {
    expect(adapter.clientConfig.brand.name).toBe('Claude');
  });

  it('has 4 permission modes', () => {
    const modes = adapter.clientConfig.permissionModes;
    expect(modes).toHaveLength(4);
    expect(modes.map((m) => m.id)).toEqual(['normal', 'acceptEdits', 'plan', 'bypassPermissions']);
  });

  it('has usage tiers including sonnet', () => {
    const tiers = adapter.clientConfig.usageTiers;
    expect(tiers.length).toBeGreaterThanOrEqual(3);
    expect(tiers.find((t) => t.key === 'seven_day_sonnet')).toBeDefined();
  });

  it('defaultModels has default with supportsFastMode', () => {
    const def = adapter.clientConfig.defaultModels.find((m) => m.value === 'default');
    expect(def).toBeDefined();
    expect(def!.supportsFastMode).toBe(true);
  });

  it('defaultModels has sonnet and haiku', () => {
    const models = adapter.clientConfig.defaultModels;
    expect(models.find((m) => m.value === 'sonnet')).toBeDefined();
    expect(models.find((m) => m.value === 'haiku')).toBeDefined();
  });

  it('mcpScopes includes claudeai with prefix', () => {
    const claudeai = adapter.clientConfig.mcpScopes.find((s) => s.id === 'claudeai');
    expect(claudeai).toBeDefined();
    expect(claudeai!.prefix).toBe('claude.ai ');
  });
});
