import { describe, expect, it } from 'vitest';
import { calculateCost, getModelDefinition, MODEL_DEFINITIONS } from '../model-config.ts';

describe('model-config', () => {
  it('defines Haiku, Sonnet, and Opus models', () => {
    expect(MODEL_DEFINITIONS).toHaveLength(3);
    expect(MODEL_DEFINITIONS.map((m) => m.id)).toEqual(['haiku', 'sonnet', 'opus']);
  });

  it('returns model definition by id', () => {
    const haiku = getModelDefinition('haiku');
    expect(haiku).toBeDefined();
    expect(haiku?.name).toContain('Haiku');
  });

  it('returns undefined for unknown model', () => {
    expect(getModelDefinition('unknown' as 'haiku')).toBeUndefined();
  });

  it('calculates cost for haiku', () => {
    const cost = calculateCost('haiku', { inputTokens: 1000, outputTokens: 500 });
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeLessThan(0.01);
  });

  it('calculates cost for opus is higher than haiku', () => {
    const haikuCost = calculateCost('haiku', { inputTokens: 1000, outputTokens: 500 });
    const opusCost = calculateCost('opus', { inputTokens: 1000, outputTokens: 500 });
    expect(opusCost).toBeGreaterThan(haikuCost);
  });
});
