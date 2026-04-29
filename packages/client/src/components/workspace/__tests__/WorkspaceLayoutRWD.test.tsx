import { act, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setupMatchMedia } from '../../../test/fake-match-media';
import { renderWithWorkspace } from '../../../test/render-with-workspace';

async function setupWithProject(width: number) {
  setupMatchMedia(width);
  const result = await renderWithWorkspace();
  const project = await result.addProject();
  await project.launchSession();
  return result;
}

function sidebar() {
  return screen.getByRole('complementary', { name: 'sidebar-panel' });
}
function rightPane() {
  return screen.getByRole('complementary', { name: 'right-pane-drawer' });
}
function queryRightPane() {
  return screen.queryByRole('complementary', { name: 'right-pane-drawer' });
}

afterEach(() => vi.restoreAllMocks());

describe('WorkspaceLayout — Desktop (≥1024px)', () => {
  it('does NOT render ActivityBar', async () => {
    await setupWithProject(1440);
    expect(screen.queryByRole('complementary', { name: 'activity-bar' })).toBeNull();
    expect(screen.queryByTitle('Projects')).toBeNull();
  });

  it('renders sidebar + right pane as docked columns by default', async () => {
    await setupWithProject(1440);
    expect(sidebar()).toBeInTheDocument();
    expect(sidebar()).toHaveAttribute('data-open');
    expect(rightPane()).toBeInTheDocument();
    expect(rightPane()).toHaveAttribute('data-open');
  });

  it('renders the RightPane body inside the right pane element', async () => {
    await setupWithProject(1440);
    expect(screen.getByLabelText('right-pane-body')).toBeInTheDocument();
  });

  it('shows Toggle sidebar + Toggle right pane in the topbar', async () => {
    await setupWithProject(1440);
    expect(screen.getByRole('button', { name: /toggle sidebar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /toggle right pane/i })).toBeInTheDocument();
  });

  it('shows Settings button in topbar; click opens Settings dialog', async () => {
    const { user } = await setupWithProject(1440);
    await user.click(screen.getByRole('button', { name: /settings/i }));
    expect(await screen.findByRole('dialog', { name: /settings/i })).toBeInTheDocument();
  });
});

describe('WorkspaceLayout — Tablet (768–1023px)', () => {
  it('does NOT render ActivityBar', async () => {
    await setupWithProject(800);
    expect(screen.queryByRole('complementary', { name: 'activity-bar' })).toBeNull();
  });

  it('sidebar element exists in DOM but starts closed (no data-open)', async () => {
    await setupWithProject(800);
    expect(sidebar()).toBeInTheDocument();
    expect(sidebar()).not.toHaveAttribute('data-open');
  });

  it('right pane element exists in DOM but starts closed', async () => {
    await setupWithProject(800);
    expect(rightPane()).toBeInTheDocument();
    expect(rightPane()).not.toHaveAttribute('data-open');
  });

  it('Toggle sidebar opens the sidebar drawer', async () => {
    const { user } = await setupWithProject(800);
    await user.click(screen.getByRole('button', { name: /toggle sidebar/i }));
    expect(sidebar()).toHaveAttribute('data-open');
  });

  it('Toggle right pane opens the right pane drawer', async () => {
    const { user } = await setupWithProject(800);
    await user.click(screen.getByRole('button', { name: /toggle right pane/i }));
    expect(rightPane()).toHaveAttribute('data-open');
  });

  it('clicking right backdrop closes the right drawer', async () => {
    const { user } = await setupWithProject(800);
    await user.click(screen.getByRole('button', { name: /toggle right pane/i }));
    await user.click(screen.getByRole('button', { name: /dismiss right pane/i }));
    expect(rightPane()).not.toHaveAttribute('data-open');
  });

  it('clicking backdrop closes the sidebar drawer', async () => {
    const { user } = await setupWithProject(800);
    await user.click(screen.getByRole('button', { name: /toggle sidebar/i }));
    await user.click(screen.getByRole('button', { name: /dismiss sidebar/i }));
    expect(sidebar()).not.toHaveAttribute('data-open');
  });

  it('shows Settings button in topbar; click opens dialog', async () => {
    const { user } = await setupWithProject(800);
    await user.click(screen.getByRole('button', { name: /settings/i }));
    expect(await screen.findByRole('dialog', { name: /settings/i })).toBeInTheDocument();
  });
});

describe('WorkspaceLayout — Mobile (<768px)', () => {
  it('does NOT render ActivityBar', async () => {
    await setupWithProject(375);
    expect(screen.queryByRole('complementary', { name: 'activity-bar' })).toBeNull();
  });

  it('both panes start closed but elements exist', async () => {
    await setupWithProject(375);
    expect(sidebar()).not.toHaveAttribute('data-open');
    expect(rightPane()).not.toHaveAttribute('data-open');
  });

  it('Toggle sidebar opens drawer on mobile', async () => {
    const { user } = await setupWithProject(375);
    await user.click(screen.getByRole('button', { name: /toggle sidebar/i }));
    expect(sidebar()).toHaveAttribute('data-open');
  });

  it('Toggle right pane opens right drawer on mobile', async () => {
    const { user } = await setupWithProject(375);
    await user.click(screen.getByRole('button', { name: /toggle right pane/i }));
    expect(rightPane()).toHaveAttribute('data-open');
  });

  it('shows Settings button in mobile topbar; click opens dialog', async () => {
    const { user } = await setupWithProject(375);
    await user.click(screen.getByRole('button', { name: /settings/i }));
    expect(await screen.findByRole('dialog', { name: /settings/i })).toBeInTheDocument();
  });
});

describe('WorkspaceLayout — state preservation across breakpoints', () => {
  it('crossing tablet→desktop does NOT remount the project tab container', async () => {
    const fakeMM = setupMatchMedia(1023);
    const result = await renderWithWorkspace();
    const project = await result.addProject();
    await project.launchSession();

    const elBefore = screen.getByLabelText('project-container');
    fakeMM.triggerChange(1025);
    const elAfter = screen.getByLabelText('project-container');

    expect(elAfter).toBe(elBefore);
  });

  it('crossing desktop→tablet does NOT remount the project tab container', async () => {
    const fakeMM = setupMatchMedia(1440);
    const result = await renderWithWorkspace();
    const project = await result.addProject();
    await project.launchSession();

    const elBefore = screen.getByLabelText('project-container');
    fakeMM.triggerChange(800);
    const elAfter = screen.getByLabelText('project-container');

    expect(elAfter).toBe(elBefore);
  });

  it('crossing desktop→mobile auto-collapses both drawers (state syncs to breakpoint)', async () => {
    const fakeMM = setupMatchMedia(1440);
    const result = await renderWithWorkspace();
    const project = await result.addProject();
    await project.launchSession();
    expect(sidebar()).toHaveAttribute('data-open');
    expect(rightPane()).toHaveAttribute('data-open');

    act(() => {
      fakeMM.triggerChange(375);
    });

    expect(sidebar()).not.toHaveAttribute('data-open');
    expect(queryRightPane()).not.toHaveAttribute('data-open');
  });

  it('sidebar element is always present in the DOM (visibility CSS-driven)', async () => {
    setupMatchMedia(800);
    const result = await renderWithWorkspace();
    const project = await result.addProject();
    await project.launchSession();
    expect(sidebar()).toBeInTheDocument();
  });
});

describe('WorkspaceLayout — RWD layout width constraints', () => {
  it('active project container has min-w-0 to prevent overflow on mobile', async () => {
    await setupWithProject(375);
    expect(screen.getByLabelText('project-container')).toHaveClass('min-w-0');
  });

  it('active tab container has min-w-0 to prevent InputArea centering bug on mobile', async () => {
    await setupWithProject(375);
    expect(screen.getByLabelText('tab-container')).toHaveClass('min-w-0');
  });

  it('TabContainer root has min-w-0 so content does not force parent wider than viewport', async () => {
    await setupWithProject(375);
    expect(screen.getByLabelText('tab-container')).toHaveClass('min-w-0');
  });
});
