/**
 * Contract test: launchOptionsSchema effort & pluginInstallSchema scope
 * must accept all values the extension sends.
 */
import { describe, expect, it } from 'vitest';
import { launchOptionsSchema, pluginInstallSchema } from '../chat.ts';

describe('launchOptionsSchema effort (contract)', () => {
  for (const effort of ['low', 'medium', 'high', 'max'] as const) {
    it(`accepts effort: '${effort}'`, () => {
      const result = launchOptionsSchema.safeParse({ effort });
      expect(result.success).toBe(true);
    });
  }

  it("rejects effort: 'ultra'", () => {
    const result = launchOptionsSchema.safeParse({ effort: 'ultra' });
    expect(result.success).toBe(false);
  });
});

describe('pluginInstallSchema scope (contract)', () => {
  for (const scope of ['user', 'workspace', 'project', 'local'] as const) {
    it(`accepts scope: '${scope}'`, () => {
      const result = pluginInstallSchema.safeParse({ pluginId: 'test', scope });
      expect(result.success).toBe(true);
    });
  }
});
