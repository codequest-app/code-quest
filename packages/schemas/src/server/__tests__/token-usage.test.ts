import { describe, expect, it } from 'vitest';
import { tokenUsageSchema } from '../system.ts';

describe('tokenUsageSchema', () => {
  it('accepts valid token counts', () => {
    const result = tokenUsageSchema.parse({ input_tokens: 100, output_tokens: 50 });
    expect(result.input_tokens).toBe(100);
    expect(result.output_tokens).toBe(50);
  });

  it('accepts partial (optional fields)', () => {
    expect(tokenUsageSchema.parse({})).toEqual({});
    expect(tokenUsageSchema.parse({ input_tokens: 5 })).toEqual({ input_tokens: 5 });
  });

  it('strips unknown fields', () => {
    const result = tokenUsageSchema.parse({ input_tokens: 1, cache_creation_input_tokens: 999 });
    expect(result.input_tokens).toBe(1);
  });
});
