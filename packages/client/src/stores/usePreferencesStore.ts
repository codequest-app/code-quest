import {
  type ColorTheme,
  type Density,
  DISMISSIBLE_IDS,
  type FontSize,
  type PreferencesState as PersistedPreferences,
  preferencesStateSchema,
} from '@code-quest/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type { ColorTheme, Density, FontSize };

interface PreferencesState extends PersistedPreferences {
  setColorTheme: (v: ColorTheme) => void;
  setFontSize: (v: FontSize) => void;
  setDensity: (v: Density) => void;
  setHiddenItems: (v: string[]) => void;
  hideItem: (id: string) => void;
  showItem: (id: string) => void;
  clearHiddenItems: () => void;
}

const DEFAULTS: PersistedPreferences = {
  colorTheme: 'system',
  fontSize: 'md',
  density: 'comfortable',
  hiddenItems: [],
};

const persistedPreferencesSchema = preferencesStateSchema.partial();

interface V2Shape {
  colorTheme?: ColorTheme;
  fontSize?: FontSize;
  density?: Density;
  hiddenItems?: string[];
  isOnboardingDismissed?: boolean;
  isReviewUpsellDismissed?: boolean;
}

function migrateV2ToV3(persisted: V2Shape): Partial<PersistedPreferences> {
  const hidden = new Set(persisted.hiddenItems ?? []);
  if (persisted.isOnboardingDismissed) hidden.add(DISMISSIBLE_IDS.onboardingOverlay);
  if (persisted.isReviewUpsellDismissed) hidden.add(DISMISSIBLE_IDS.reviewUpsellBanner);
  const { isOnboardingDismissed, isReviewUpsellDismissed, ...rest } = persisted;
  void isOnboardingDismissed;
  void isReviewUpsellDismissed;
  return { ...rest, hiddenItems: [...hidden] };
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setColorTheme: (colorTheme) => set({ colorTheme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setDensity: (density) => set({ density }),
      setHiddenItems: (hiddenItems) => set({ hiddenItems }),
      hideItem: (id) =>
        set((s) => (s.hiddenItems.includes(id) ? s : { hiddenItems: [...s.hiddenItems, id] })),
      showItem: (id) => set((s) => ({ hiddenItems: s.hiddenItems.filter((i) => i !== id) })),
      clearHiddenItems: () => set({ hiddenItems: [] }),
    }),
    {
      name: 'code-quest:preferences',
      version: 3,
      migrate: (persisted: unknown, fromVersion: number) => {
        const v2 = fromVersion < 3 ? migrateV2ToV3((persisted ?? {}) as V2Shape) : persisted;
        const parsed = persistedPreferencesSchema.safeParse(v2);
        const prev = parsed.success ? parsed.data : {};
        return { ...DEFAULTS, ...prev } as PreferencesState;
      },
    },
  ),
);
