import type { MapTheme } from '@code-quest/shared';
import { BUILT_IN_THEMES } from '@code-quest/shared';
import { create } from 'zustand';

const THEME_STORAGE_KEY = 'code-quest-theme';
const DEFAULT_THEME = 'classic';

interface ThemeStore {
  currentTheme: string;
  themes: Map<string, MapTheme>;
  setTheme: (name: string) => void;
  registerTheme: (theme: MapTheme) => void;
  getTheme: () => MapTheme;
  restoreFromStorage: () => string;
}

function buildInitialThemes(): Map<string, MapTheme> {
  const map = new Map<string, MapTheme>();
  for (const t of BUILT_IN_THEMES) {
    map.set(t.name, t);
  }
  return map;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  currentTheme: DEFAULT_THEME,
  themes: buildInitialThemes(),

  setTheme: (name: string) => {
    const { themes } = get();
    if (!themes.has(name)) {
      set({ currentTheme: DEFAULT_THEME });
      return;
    }
    set({ currentTheme: name });
    try {
      localStorage.setItem(THEME_STORAGE_KEY, name);
    } catch {
      // ignore
    }
  },

  registerTheme: (theme: MapTheme) => {
    set((state) => {
      const themes = new Map(state.themes);
      themes.set(theme.name, theme);
      return { themes };
    });
  },

  getTheme: () => {
    const { currentTheme, themes } = get();
    return themes.get(currentTheme) ?? (themes.get(DEFAULT_THEME) as MapTheme);
  },

  restoreFromStorage: () => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && get().themes.has(saved)) {
      set({ currentTheme: saved });
      return saved;
    }
    return DEFAULT_THEME;
  },
}));

// Auto-restore persisted theme on load
useThemeStore.getState().restoreFromStorage();
