import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithWorkspace } from '../../test/render-with-workspace';

type MediaQueryListener = (e: MediaQueryListEvent) => void;

function mockMatchMedia(width: number) {
  let currentWidth = width;
  const listeners = new Map<string, Set<MediaQueryListener>>();

  const queryMatches = (query: string, w: number) => {
    if (query === '(min-width: 1024px)') return w >= 1024;
    if (query === '(min-width: 768px)') return w >= 768;
    return false;
  };

  window.matchMedia = vi.fn(
    (query: string) =>
      ({
        get matches() {
          return queryMatches(query, currentWidth);
        },
        media: query,
        addEventListener: (_: string, fn: MediaQueryListener) => {
          if (!listeners.has(query)) listeners.set(query, new Set());
          listeners.get(query)!.add(fn);
        },
        removeEventListener: (_: string, fn: MediaQueryListener) => {
          listeners.get(query)?.delete(fn);
        },
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );

  return {
    triggerChange: (newWidth: number) => {
      currentWidth = newWidth;
      for (const [query, fns] of listeners) {
        const matches = queryMatches(query, newWidth);
        for (const fn of fns) fn({ matches } as MediaQueryListEvent);
      }
    },
  };
}

async function setupWithProject(width: number) {
  mockMatchMedia(width);
  const result = await renderWithWorkspace();
  const project = await result.addProject();
  await project.launchSession();
  return result;
}

afterEach(() => vi.restoreAllMocks());

describe('WorkspaceLayout — Desktop (≥1024px)', () => {
  it('shows ActivityBar', async () => {
    await setupWithProject(1440);
    expect(screen.getByTitle('Projects')).toBeInTheDocument();
  });

  it('shows sidebar inline (not as overlay)', async () => {
    await setupWithProject(1440);
    const sidebar = screen.getByTestId('sidebar-panel');
    expect(sidebar.className).not.toContain('fixed');
  });
});

describe('WorkspaceLayout — Tablet (768–1023px)', () => {
  it('shows ActivityBar', async () => {
    await setupWithProject(800);
    expect(screen.getByTitle('Projects')).toBeInTheDocument();
  });

  it('sidebar is hidden by default', async () => {
    await setupWithProject(800);
    expect(screen.queryByTestId('sidebar-panel')).not.toBeInTheDocument();
  });

  it('clicking ActivityBar opens sidebar as overlay drawer', async () => {
    const { user } = await setupWithProject(800);
    await user.click(screen.getByTitle('Projects'));
    const sidebar = screen.getByTestId('sidebar-panel');
    expect(sidebar).toBeInTheDocument();
    expect(sidebar.className).toContain('fixed');
  });

  it('shows backdrop when drawer is open', async () => {
    const { user } = await setupWithProject(800);
    await user.click(screen.getByTitle('Projects'));
    expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument();
  });

  it('clicking backdrop closes the drawer', async () => {
    const { user } = await setupWithProject(800);
    await user.click(screen.getByTitle('Projects'));
    expect(screen.getByTestId('sidebar-panel')).toBeInTheDocument();

    await user.click(screen.getByTestId('sidebar-backdrop'));
    expect(screen.queryByTestId('sidebar-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument();
  });
});

describe('WorkspaceLayout — Mobile (<768px)', () => {
  it('hides ActivityBar on mobile', async () => {
    await setupWithProject(375);
    expect(screen.queryByTitle('Projects')).not.toBeInTheDocument();
  });

  it('sidebar is hidden by default on mobile', async () => {
    await setupWithProject(375);
    expect(screen.queryByTestId('sidebar-panel')).not.toBeInTheDocument();
  });

  it('shows Menu button in mobile top bar', async () => {
    await setupWithProject(375);
    expect(screen.getByTestId('mobile-topbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
  });

  it('tapping Menu button opens sidebar', async () => {
    const { user } = await setupWithProject(375);
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByTestId('sidebar-panel')).toBeInTheDocument();
  });

  it('sidebar opened via Menu button is a fixed overlay', async () => {
    const { user } = await setupWithProject(375);
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByTestId('sidebar-panel').className).toContain('fixed');
  });
});

describe('WorkspaceLayout — RWD layout width constraints', () => {
  it('active project container has min-w-0 to prevent overflow on mobile', async () => {
    await setupWithProject(375);
    const el = screen.getByTestId('project-container');
    expect(el.className).toContain('min-w-0');
  });

  it('active tab container has min-w-0 to prevent InputArea centering bug on mobile', async () => {
    await setupWithProject(375);
    const el = screen.getByTestId('tab-container');
    expect(el.className).toContain('min-w-0');
  });

  it('EditorArea root has min-w-0 so content does not force parent wider than viewport', async () => {
    await setupWithProject(375);
    const el = screen.getByTestId('editor-area');
    expect(el.className).toContain('min-w-0');
  });
});
