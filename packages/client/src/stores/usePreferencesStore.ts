import {
  type ColorTheme,
  type Density,
  type FontSize,
  type Layout,
  type PreferencesState as PersistedPreferences,
  preferencesStateSchema,
} from '@code-quest/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type { ColorTheme, Density, FontSize, Layout };

interface PreferencesState extends PersistedPreferences {
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

const persistedPreferencesSchema = preferencesStateSchema.partial();

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
        const parsed = persistedPreferencesSchema.safeParse(persisted);
        const prev = parsed.success ? parsed.data : {};
        return { ...DEFAULTS, ...prev } as PreferencesState;
      },
    },
  ),
);
