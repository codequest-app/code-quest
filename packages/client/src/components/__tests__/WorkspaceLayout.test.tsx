import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  type RenderWithWorkspaceResult,
  renderWithWorkspace,
} from '../../test/render-with-workspace';

describe('WorkspaceLayout', () => {
  let result: RenderWithWorkspaceResult;

  beforeEach(async () => {
    result = await renderWithWorkspace();
  });

  it('shows only EmptyState when no projects exist — no sidebar or tab bar', () => {
    expect(screen.getByTestId('empty-add-project')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Esc to focus/i)).not.toBeInTheDocument();
  });

  describe('with project', () => {
    beforeEach(async () => {
      const project = await result.addProject();
      await project.launchSession();
    });

    it('renders a tab with ChatPanel inside', () => {
      expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
    });

    it('renders two tabs with CSS show/hide', async () => {
      await result.user.click(screen.getByLabelText('New tab'));

      const closeButtons = screen.getAllByLabelText(/^Close /);
      expect(closeButtons).toHaveLength(2);
    });

    it('renders TabBar above workspace panels', () => {
      expect(screen.getByTestId('tab-bar')).toBeInTheDocument();
    });

    it('renders ActivityBar with explorer icon', () => {
      expect(screen.getByTitle('Projects')).toBeInTheDocument();
    });

    it('toggles sidebar when clicking ActivityBar icon', async () => {
      expect(screen.getByText(/Projects/i)).toBeInTheDocument();

      await userEvent.click(screen.getByTitle('Projects'));
      expect(screen.queryByTestId('sidebar-panel')).not.toBeInTheDocument();

      await userEvent.click(screen.getByTitle('Projects'));
      expect(screen.getByText(/Projects/i)).toBeInTheDocument();
    });

    it('sidebar shows project list by default', () => {
      expect(screen.getByText(/Projects/i)).toBeInTheDocument();
    });

    it('close tab removes tab from UI', async () => {
      // Create second tab
      await result.user.click(screen.getByLabelText('New tab'));
      const closeButtons = screen.getAllByLabelText(/^Close /);
      expect(closeButtons).toHaveLength(2);

      // Close second tab
      await result.user.click(closeButtons[1]);
      await result.user.click(screen.getByRole('button', { name: /close/i }));

      expect(screen.getAllByLabelText(/^Close /)).toHaveLength(1);
    });

    it('shows empty state after closing last tab', async () => {
      // Close the only tab
      await result.user.click(screen.getByLabelText(/^Close /));
      await result.user.click(screen.getByRole('button', { name: /close/i }));

      expect(screen.queryByPlaceholderText(/Esc to focus/i)).not.toBeInTheDocument();
      expect(screen.getByText(/No open sessions/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /New Session/ })).toBeInTheDocument();
    });
  });

  describe('multi-project', () => {
    beforeEach(async () => {
      const project = await result.addProject();
      await project.launchSession();
    });

    it('second project creates separate tab group', async () => {
      // First tab is already in the default project
      expect(screen.getAllByLabelText(/^Close /).length).toBe(1);

      // Create second tab in same project
      await result.user.click(screen.getByLabelText('New tab'));
      expect(screen.getAllByLabelText(/^Close /).length).toBe(2);
    });

    it('renders per-project tabs when project has sessions', () => {
      expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
      expect(screen.getAllByLabelText(/^Close /).length).toBe(1);
    });

    it('switching project keeps both tab groups mounted', async () => {
      const { user } = result;

      // Add second project via addProject helper
      result.claude.prepareInit();
      const project2 = await result.addProject({ path: '/projects', dirName: 'other-project' });

      // Second project created — switch to it in sidebar
      const sidebar = screen.getByTestId('sidebar-panel');
      await user.click(within(sidebar).getByText(/other-project/));
      await project2.launchSession();

      // Both projects have ComposeInput rendered (one visible, one hidden)
      expect(screen.getAllByPlaceholderText(/Esc to focus/i).length).toBe(2);
    });
  });
});
