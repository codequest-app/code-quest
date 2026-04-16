import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  isOnboardingDismissed: boolean;
  isReviewUpsellDismissed: boolean;
  dismissOnboarding: () => void;
  dismissReviewUpsell: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      isOnboardingDismissed: false,
      isReviewUpsellDismissed: false,
      dismissOnboarding: () => set({ isOnboardingDismissed: true }),
      dismissReviewUpsell: () => set({ isReviewUpsellDismissed: true }),
    }),
    { name: 'code-quest:preferences' },
  ),
);
