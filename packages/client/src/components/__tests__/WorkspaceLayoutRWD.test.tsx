import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setupMatchMedia } from '../../test/fake-match-media';
import { renderWithWorkspace } from '../../test/render-with-workspace';

async function setupWithProject(width: number) {
  setupMatchMedia(width);
  const result = await renderWithWorkspace();
  const project = await result.addProject();
  await project.launchSession();
  return result;
}

afterEach(() => vi.restoreAllMocks());

describe('WorkspaceLayout — Desktop (≥1024px)', () => {
  it('does NOT render ActivityBar', async () => {
    await setupWithProject(1440);
    expect(screen.queryByTestId('activity-bar')).toBeNull();
    expect(screen.queryByTitle('Projects')).toBeNull();
  });

  it('sidebar is always visible (inline, not overlay)', async () => {
    await setupWithProject(1440);
    const sidebar = screen.getByTestId('sidebar-panel');
    expect(sidebar.className).not.toContain('fixed');
  });

  it('shows Settings button in topbar; click opens Settings dialog', async () => {
    const { user } = await setupWithProject(1440);
    const settings = screen.getByRole('button', { name: /settings/i });
    expect(settings).toBeInTheDocument();
    await user.click(settings);
    expect(await screen.findByRole('dialog', { name: /settings/i })).toBeInTheDocument();
  });

  it('does NOT render a hamburger on desktop', async () => {
    await setupWithProject(1440);
    expect(screen.queryByRole('button', { name: /^menu$/i })).toBeNull();
  });
});

describe('WorkspaceLayout — Tablet (768–1023px)', () => {
  it('does NOT render ActivityBar', async () => {
    await setupWithProject(800);
    expect(screen.queryByTestId('activity-bar')).toBeNull();
    expect(screen.queryByTitle('Projects')).toBeNull();
  });

  it('sidebar is hidden by default', async () => {
    await setupWithProject(800);
    expect(screen.queryByTestId('sidebar-panel')).not.toBeInTheDocument();
  });

  it('topbar hamburger opens sidebar as overlay drawer', async () => {
    const { user } = await setupWithProject(800);
    await user.click(screen.getByRole('button', { name: /^menu$/i }));
    const sidebar = screen.getByTestId('sidebar-panel');
    expect(sidebar).toBeInTheDocument();
    expect(sidebar.className).toContain('fixed');
  });

  it('shows backdrop when drawer is open', async () => {
    const { user } = await setupWithProject(800);
    await user.click(screen.getByRole('button', { name: /^menu$/i }));
    expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument();
  });

  it('clicking backdrop closes the drawer', async () => {
    const { user } = await setupWithProject(800);
    await user.click(screen.getByRole('button', { name: /^menu$/i }));
    expect(screen.getByTestId('sidebar-panel')).toBeInTheDocument();

    await user.click(screen.getByTestId('sidebar-backdrop'));
    expect(screen.queryByTestId('sidebar-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument();
  });

  it('shows Settings button in topbar; click opens dialog', async () => {
    const { user } = await setupWithProject(800);
    await user.click(screen.getByRole('button', { name: /settings/i }));
    expect(await screen.findByRole('dialog', { name: /settings/i })).toBeInTheDocument();
  });
});

describe('WorkspaceLayout — Mobile (<768px)', () => {
  it('does NOT render ActivityBar on mobile', async () => {
    await setupWithProject(375);
    expect(screen.queryByTestId('activity-bar')).toBeNull();
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

  it('shows Settings button in mobile topbar; click opens dialog', async () => {
    const { user } = await setupWithProject(375);
    await user.click(screen.getByRole('button', { name: /settings/i }));
    expect(await screen.findByRole('dialog', { name: /settings/i })).toBeInTheDocument();
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
    const el = screen.getByTestId('tab-container-root');
    expect(el.className).toContain('min-w-0');
  });

  it('TabContainer root has min-w-0 so content does not force parent wider than viewport', async () => {
    await setupWithProject(375);
    const el = screen.getByTestId('tab-container-root');
    expect(el.className).toContain('min-w-0');
  });
});
