import { describe, expect, it } from 'vitest';
import { preferencesStateSchema } from '../preferences-schema.ts';

describe('preferencesStateSchema', () => {
  it('accepts a fully-populated state', () => {
    const parsed = preferencesStateSchema.safeParse({
      colorTheme: 'dark',
      fontSize: 'md',
      density: 'comfortable',
      layout: 'a',
      hiddenItems: ['raw'],
      isOnboardingDismissed: false,
      isReviewUpsellDismissed: true,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects unknown enum values', () => {
    const parsed = preferencesStateSchema.safeParse({
      colorTheme: 'sepia',
      fontSize: 'md',
      density: 'comfortable',
      layout: 'a',
      hiddenItems: [],
      isOnboardingDismissed: false,
      isReviewUpsellDismissed: false,
    });
    expect(parsed.success).toBe(false);
  });

  it('partial() accepts missing fields (for persisted migration)', () => {
    const parsed = preferencesStateSchema.partial().safeParse({ colorTheme: 'light' });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toEqual({ colorTheme: 'light' });
  });

  it('partial() drops unknown-enum fields via safeParse (returns failure, caller falls back)', () => {
    const parsed = preferencesStateSchema.partial().safeParse({ density: 'roomy' });
    expect(parsed.success).toBe(false);
  });

  it('accepts colorTheme: system (third option)', () => {
    const parsed = preferencesStateSchema.partial().safeParse({ colorTheme: 'system' });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.colorTheme).toBe('system');
  });
});
