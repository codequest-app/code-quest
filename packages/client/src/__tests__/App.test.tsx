import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import { usePreferencesStore } from '../stores/usePreferencesStore';

describe('App', () => {
  it('renders WorkspaceLayout without hitting ErrorBoundary — all providers are present', () => {
    render(<App />);

    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('shows only EmptyState when no projects exist — no sidebar or tab bar', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: 'Add Project' })).toBeInTheDocument();
    expect(screen.queryByRole('tablist', { name: 'tab-bar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'sidebar-panel' })).not.toBeInTheDocument();
  });

  it('syncs preferences axes to <html> data-attrs', () => {
    usePreferencesStore.setState({
      colorTheme: 'light',
      fontSize: 'lg',
      density: 'compact',
    });
    render(<App />);
    const ds = document.documentElement.dataset;
    expect(ds.theme).toBe('light');
    expect(ds.font).toBe('lg');
    expect(ds.density).toBe('compact');
  });

  it('writes resolved effective theme to data-theme when preference is system', () => {
    // jsdom matchMedia mock in test/setup.ts returns matches=false for
    // prefers-color-scheme: dark (the mock answers true only for min-width queries)
    usePreferencesStore.setState({ colorTheme: 'system' });
    render(<App />);
    const theme = document.documentElement.dataset.theme;
    expect(theme === 'dark' || theme === 'light').toBe(true);
    expect(theme).not.toBe('system');
  });
});
