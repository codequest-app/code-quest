import { beforeEach, describe, expect, it } from 'vitest';
import { useThemeStore } from '../themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({
      currentTheme: 'classic',
      themes: new Map(useThemeStore.getState().themes),
    });
  });

  it('defaults to classic theme', () => {
    expect(useThemeStore.getState().currentTheme).toBe('classic');
  });

  it('setTheme switches current theme', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().currentTheme).toBe('dark');
  });

  it('persists theme to localStorage', () => {
    useThemeStore.getState().setTheme('dark');
    const saved = localStorage.getItem('code-quest-theme');
    expect(saved).toBe('dark');
  });

  it('getTheme returns the current MapTheme object', () => {
    const theme = useThemeStore.getState().getTheme();
    expect(theme.name).toBe('classic');
    expect(theme.cssClass).toBe('classic');
    expect(theme.colors.background).toBeTruthy();
  });

  it('registerTheme adds a custom theme', () => {
    useThemeStore.getState().registerTheme({
      name: 'retro',
      cssClass: 'retro',
      colors: {
        background: '#000',
        ground: '#111',
        building: '#222',
        buildingHover: '#333',
        text: '#0f0',
        accent: '#0ff',
        statusBar: '#111',
      },
    });
    useThemeStore.getState().setTheme('retro');
    expect(useThemeStore.getState().getTheme().name).toBe('retro');
  });

  it('setTheme to unknown name falls back to classic', () => {
    useThemeStore.getState().setTheme('nonexistent');
    expect(useThemeStore.getState().currentTheme).toBe('classic');
  });

  it('restores theme from localStorage on init', () => {
    localStorage.setItem('code-quest-theme', 'dark');
    const restored = useThemeStore.getState().restoreFromStorage();
    expect(restored).toBe('dark');
  });

  it('auto-restores theme on module load via restoreFromStorage', () => {
    // Verify restoreFromStorage is callable and works with persisted data
    localStorage.setItem('code-quest-theme', 'dark');
    useThemeStore.getState().restoreFromStorage();
    expect(useThemeStore.getState().currentTheme).toBe('dark');
  });
});
