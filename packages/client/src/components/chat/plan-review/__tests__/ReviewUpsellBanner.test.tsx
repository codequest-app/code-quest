import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePreferencesStore } from '../../../../stores/usePreferencesStore';
import { renderWithWorkspace } from '../../../../test/render-with-workspace';

describe('ReviewUpsellBanner', () => {
  beforeEach(() => {
    usePreferencesStore.setState({ hiddenItems: [] });
  });

  it('does not render when gate is off', async () => {
    const { addProject: addProj } = await renderWithWorkspace();
    const proj = await addProj();
    await proj.launchSession();
    // No experiment gate → banner not shown
    expect(screen.queryByText('Try the new code review feature')).not.toBeInTheDocument();
  });

  it('renders when gate is on and not dismissed', async () => {
    const { claude, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();
    await act(async () => {
      await claude.emit(s.experimentGates({ review_upsell: true }));
    });
    expect(screen.getByText('Try the new code review feature')).toBeInTheDocument();
  });

  it('does not render when gate is on but dismissed', async () => {
    usePreferencesStore.setState({ hiddenItems: ['banner-review-upsell'] });
    const { claude, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();
    await act(async () => {
      await claude.emit(s.experimentGates({ review_upsell: true }));
    });
    expect(screen.queryByText('Try the new code review feature')).not.toBeInTheDocument();
  });

  it('dismisses when clicking Dismiss button', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const { claude, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();
    await act(async () => {
      await claude.emit(s.experimentGates({ review_upsell: true }));
    });
    expect(screen.getByText('Try the new code review feature')).toBeInTheDocument();

    const dismissBtn =
      screen.queryByRole('button', { name: /dismiss/i }) ??
      screen.queryByTitle(/dismiss/i) ??
      screen.queryByText(/dismiss/i);
    expect(dismissBtn).toBeTruthy();
    await user.click(dismissBtn!);
    expect(screen.queryByText('Try the new code review feature')).not.toBeInTheDocument();
  });
});
