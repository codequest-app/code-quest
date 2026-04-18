import { beforeEach, describe, expect, it } from 'vitest';
import { usePreferencesStore } from '../usePreferencesStore';

const STORAGE_KEY = 'code-quest:preferences';

describe('usePreferencesStore', () => {
  beforeEach(() => {
    localStorage.clear();
    usePreferencesStore.setState({
      colorTheme: 'dark',
      fontSize: 'md',
      density: 'comfortable',
      layout: 'a',
      hiddenItems: [],
      isOnboardingDismissed: false,
      isReviewUpsellDismissed: false,
    });
  });

  it('has correct default state', () => {
    const state = usePreferencesStore.getState();
    expect(state.colorTheme).toBe('dark');
    expect(state.fontSize).toBe('md');
    expect(state.density).toBe('comfortable');
    expect(state.layout).toBe('a');
    expect(state.hiddenItems).toEqual([]);
    expect(state.isOnboardingDismissed).toBe(false);
    expect(state.isReviewUpsellDismissed).toBe(false);
  });

  it('setColorTheme accepts light and persists', () => {
    usePreferencesStore.getState().setColorTheme('light');
    expect(usePreferencesStore.getState().colorTheme).toBe('light');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored.state.colorTheme).toBe('light');
  });

  it('axis setters update individual fields', () => {
    usePreferencesStore.getState().setFontSize('lg');
    expect(usePreferencesStore.getState().fontSize).toBe('lg');

    usePreferencesStore.getState().setDensity('compact');
    expect(usePreferencesStore.getState().density).toBe('compact');

    usePreferencesStore.getState().setLayout('b');
    expect(usePreferencesStore.getState().layout).toBe('b');

    usePreferencesStore.getState().setHiddenItems(['foo', 'bar']);
    expect(usePreferencesStore.getState().hiddenItems).toEqual(['foo', 'bar']);
  });

  it('dismissOnboarding / dismissReviewUpsell set flags', () => {
    usePreferencesStore.getState().dismissOnboarding();
    usePreferencesStore.getState().dismissReviewUpsell();
    expect(usePreferencesStore.getState().isOnboardingDismissed).toBe(true);
    expect(usePreferencesStore.getState().isReviewUpsellDismissed).toBe(true);
  });

  it('persists axis changes to localStorage', () => {
    usePreferencesStore.getState().setFontSize('sm');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored.state.fontSize).toBe('sm');
  });

  it('migrates legacy v0 state (only onboarding/review) by filling in axis defaults', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { isOnboardingDismissed: true, isReviewUpsellDismissed: true },
        version: 0,
      }),
    );

    usePreferencesStore.persist.rehydrate();

    const state = usePreferencesStore.getState();
    expect(state.isOnboardingDismissed).toBe(true);
    expect(state.isReviewUpsellDismissed).toBe(true);
    expect(state.colorTheme).toBe('dark');
    expect(state.fontSize).toBe('md');
    expect(state.density).toBe('comfortable');
    expect(state.layout).toBe('a');
    expect(state.hiddenItems).toEqual([]);
  });
});
