import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { emitAssistantTurn, sendUserMessage } from '@/test/helpers';
import { renderWithWorkspace } from '@/test/render-with-workspace';

describe('CitationsPanel', () => {
  it('does not render citation links when none present', async () => {
    const { claude, user, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();
    await sendUserMessage(user);
    await emitAssistantTurn(claude, 'No citations here');

    // No citation links
    expect(screen.queryByRole('link', { name: /example/i })).not.toBeInTheDocument();
  });

  it('renders citation links when citations_delta arrives', async () => {
    const { claude, user, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();
    await sendUserMessage(user);
    await act(async () => {
      await claude.emitSegment(s.assistant('Check this'));
      await claude.emitSegment(s.citationsDelta({ url: 'https://example.com', title: 'Example' }));
      await claude.emitSegment(s.result());
    });

    // Citation renders as link or text with the title
    const exampleElements = screen.queryAllByText(/Example/);
    expect(exampleElements.length).toBeGreaterThan(0);
  });

  it('renders plain text when citation has no url', async () => {
    const { claude, user, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();
    await sendUserMessage(user);
    await act(async () => {
      await claude.emitSegment(s.assistant('See source'));
      await claude.emitSegment(s.citationsDelta({ title: 'No Link Source' }));
      await claude.emitSegment(s.result());
    });

    expect(screen.getByText('No Link Source')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'No Link Source' })).not.toBeInTheDocument();
  });
});
