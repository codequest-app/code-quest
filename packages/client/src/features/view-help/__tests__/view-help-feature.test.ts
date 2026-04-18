import { describe, expect, it, vi } from 'vitest';
import { createViewHelpFeature } from '../view-help-feature';

describe('createViewHelpFeature', () => {
  it('has id view-help', () => {
    const feature = createViewHelpFeature({ openUrl: vi.fn() });
    expect(feature.id).toBe('view-help');
  });

  it('is in Support category with closeSilent', () => {
    const feature = createViewHelpFeature({ openUrl: vi.fn() });
    expect(feature.label).toBe('View help docs');
    expect(feature.category).toBe('Support');
    expect(feature.ui?.closeSilent).toBe(true);
  });

  it('execute calls openUrl with provided docsUrl', () => {
    const openUrl = vi.fn();
    const feature = createViewHelpFeature({ openUrl, docsUrl: 'https://docs.example.com' });
    feature.execute();
    expect(openUrl).toHaveBeenCalledWith('https://docs.example.com');
  });

  it('execute uses fallback url when docsUrl not provided', () => {
    const openUrl = vi.fn();
    const feature = createViewHelpFeature({ openUrl });
    feature.execute();
    expect(openUrl).toHaveBeenCalledWith('https://docs.anthropic.com/en/docs/claude-code/overview');
  });
});
