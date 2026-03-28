import { beforeEach, describe, expect, it } from 'vitest';
import { usePreferencesStore } from '../usePreferencesStore';

const STORAGE_KEY = 'code-quest-preferences';

describe('usePreferencesStore', () => {
  beforeEach(() => {
    localStorage.clear();
    usePreferencesStore.setState({
      isOnboardingDismissed: false,
      isReviewUpsellDismissed: false,
    });
  });

  it('has correct default state', () => {
    const state = usePreferencesStore.getState();
    expect(state.isOnboardingDismissed).toBe(false);
    expect(state.isReviewUpsellDismissed).toBe(false);
  });

  it('dismissOnboarding sets flag to true', () => {
    usePreferencesStore.getState().dismissOnboarding();
    expect(usePreferencesStore.getState().isOnboardingDismissed).toBe(true);
  });

  it('dismissReviewUpsell sets flag to true', () => {
    usePreferencesStore.getState().dismissReviewUpsell();
    expect(usePreferencesStore.getState().isReviewUpsellDismissed).toBe(true);
  });

  it('persists to localStorage', () => {
    usePreferencesStore.getState().dismissOnboarding();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored.state.isOnboardingDismissed).toBe(true);
  });

  it('restores from localStorage', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { isOnboardingDismissed: true, isReviewUpsellDismissed: true },
        version: 0,
      }),
    );

    // Trigger rehydration by recreating — zustand persist reads on init.
    // Since the store is a singleton, we simulate by calling persist rehydrate.
    usePreferencesStore.persist.rehydrate();

    const state = usePreferencesStore.getState();
    expect(state.isOnboardingDismissed).toBe(true);
    expect(state.isReviewUpsellDismissed).toBe(true);
  });
});
