import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ColorTheme = 'dark' | 'light';
export type FontSize = 'sm' | 'md' | 'lg';
export type Density = 'comfortable' | 'compact';
export type Layout = 'a' | 'b';

interface PreferencesState {
  colorTheme: ColorTheme;
  fontSize: FontSize;
  density: Density;
  layout: Layout;
  hiddenItems: string[];

  isOnboardingDismissed: boolean;
  isReviewUpsellDismissed: boolean;

  setColorTheme: (v: ColorTheme) => void;
  setFontSize: (v: FontSize) => void;
  setDensity: (v: Density) => void;
  setLayout: (v: Layout) => void;
  setHiddenItems: (v: string[]) => void;
  dismissOnboarding: () => void;
  dismissReviewUpsell: () => void;
}

const DEFAULTS = {
  colorTheme: 'dark' as const,
  fontSize: 'md' as const,
  density: 'comfortable' as const,
  layout: 'a' as const,
  hiddenItems: [] as string[],
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      isOnboardingDismissed: false,
      isReviewUpsellDismissed: false,
      setColorTheme: (colorTheme) => set({ colorTheme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setDensity: (density) => set({ density }),
      setLayout: (layout) => set({ layout }),
      setHiddenItems: (hiddenItems) => set({ hiddenItems }),
      dismissOnboarding: () => set({ isOnboardingDismissed: true }),
      dismissReviewUpsell: () => set({ isReviewUpsellDismissed: true }),
    }),
    {
      name: 'code-quest:preferences',
      version: 2,
      migrate: (persisted: unknown) => {
        const prev = (persisted ?? {}) as Partial<PreferencesState>;
        return { ...DEFAULTS, ...prev } as PreferencesState;
      },
    },
  ),
);
