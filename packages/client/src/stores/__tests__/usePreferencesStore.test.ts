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
      hiddenItems: [],
    });
  });

  it('has correct default state', () => {
    const state = usePreferencesStore.getState();
    expect(state.colorTheme).toBe('dark');
    expect(state.fontSize).toBe('md');
    expect(state.density).toBe('comfortable');
    expect(state.hiddenItems).toEqual([]);
  });

  it('setColorTheme accepts the system value', () => {
    usePreferencesStore.getState().setColorTheme('system');
    expect(usePreferencesStore.getState().colorTheme).toBe('system');
  });

  it('migration from v2 without persisted colorTheme defaults to system', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { fontSize: 'lg' }, version: 2 }));
    usePreferencesStore.persist.rehydrate();
    expect(usePreferencesStore.getState().colorTheme).toBe('system');
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

    usePreferencesStore.getState().setHiddenItems(['foo', 'bar']);
    expect(usePreferencesStore.getState().hiddenItems).toEqual(['foo', 'bar']);
  });

  it('hideItem appends id only once (dedup)', () => {
    const { hideItem } = usePreferencesStore.getState();
    hideItem('banner-x');
    hideItem('banner-x');
    expect(usePreferencesStore.getState().hiddenItems).toEqual(['banner-x']);
  });

  it('showItem removes id from hiddenItems', () => {
    usePreferencesStore.setState({ hiddenItems: ['a', 'b', 'c'] });
    usePreferencesStore.getState().showItem('b');
    expect(usePreferencesStore.getState().hiddenItems).toEqual(['a', 'c']);
  });

  it('clearHiddenItems empties the list', () => {
    usePreferencesStore.setState({ hiddenItems: ['a', 'b'] });
    usePreferencesStore.getState().clearHiddenItems();
    expect(usePreferencesStore.getState().hiddenItems).toEqual([]);
  });

  it('persists axis changes to localStorage', () => {
    usePreferencesStore.getState().setFontSize('sm');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored.state.fontSize).toBe('sm');
  });

  it('migrates v2 → v3: legacy onboarding/review booleans fold into hiddenItems', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: {
          colorTheme: 'light',
          isOnboardingDismissed: true,
          isReviewUpsellDismissed: true,
        },
        version: 2,
      }),
    );

    usePreferencesStore.persist.rehydrate();

    const state = usePreferencesStore.getState();
    expect(state.colorTheme).toBe('light');
    expect(state.hiddenItems).toContain('onboarding-overlay');
    expect(state.hiddenItems).toContain('banner-review-upsell');
    expect(state.fontSize).toBe('md');
  });

  it('migrates v2 → v3: false booleans do not produce hiddenItems entries', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { isOnboardingDismissed: false, isReviewUpsellDismissed: false },
        version: 2,
      }),
    );

    usePreferencesStore.persist.rehydrate();

    expect(usePreferencesStore.getState().hiddenItems).toEqual([]);
  });

  it('v2 migration preserves existing hiddenItems and deduplicates', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: {
          hiddenItems: ['onboarding-overlay', 'custom-item'],
          isOnboardingDismissed: true,
        },
        version: 2,
      }),
    );

    usePreferencesStore.persist.rehydrate();

    const items = usePreferencesStore.getState().hiddenItems;
    expect(items).toEqual(['onboarding-overlay', 'custom-item']);
  });
});
