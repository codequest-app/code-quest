import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useChannelControl, useChannelMessages } from '@/contexts/channel';
import { renderWithChannel } from '@/test/render-with-channel';
import { PendingActionButtons } from '../PendingActionButtons.tsx';

function BannerWithState() {
  const { pendingControls } = useChannelControl();
  const { messages } = useChannelMessages();
  return (
    <div>
      <span role="status" aria-label="pending-count">
        {pendingControls.length}
      </span>
      <span role="status" aria-label="last-message">
        {messages[messages.length - 1]?.content ?? ''}
      </span>
      <PendingActionButtons />
    </div>
  );
}

async function setup(...controlSegments: string[]) {
  const { claude, ...rest } = await renderWithChannel(<BannerWithState />);
  await act(async () => {
    for (const seg of controlSegments) {
      await claude.emitSegment(seg);
    }
  });
  return { claude, ...rest };
}

describe('PendingActionButtons', () => {
  it('renders nothing when pendingControls is empty', async () => {
    await setup();
    expect(screen.queryByText('Yes')).toBeNull();
    expect(screen.queryByText('No')).toBeNull();
  });

  it('shows tool permission header with tool name', async () => {
    await setup(s.controlRequestBash('r1', { command: 'ls' }));
    expect(screen.getByText(/proceed with/i)).toBeInTheDocument();
    expect(screen.getAllByText('Bash').length).toBeGreaterThan(0);
  });

  it('shows numbered Yes/No buttons', async () => {
    await setup(s.controlRequestBash('r1', { command: 'ls' }));
    // Buttons contain numbered shortcuts — text split across elements
    const buttons = screen.getAllByRole('button');
    const yesBtn = buttons.find((b) => b.textContent?.includes('Yes'));
    const noBtn = buttons.find((b) => b.textContent?.includes('No'));
    expect(yesBtn).toBeDefined();
    expect(noBtn).toBeDefined();
    expect(yesBtn?.textContent).toContain('①');
  });

  it('Yes click clears pending control and adds approval message', async () => {
    const user = userEvent.setup();
    await setup(s.controlRequestBash('r1', { command: 'ls' }));
    expect(screen.getByRole('status', { name: 'pending-count' })).toHaveTextContent('1');

    const yesBtn = screen.getAllByRole('button').find((b) => b.textContent?.match(/①.*Yes/));
    await user.click(yesBtn!);

    expect(screen.getByRole('status', { name: 'pending-count' })).toHaveTextContent('0');
    expect(screen.getByRole('status', { name: 'last-message' })).toHaveTextContent(
      /Approved.*Bash/,
    );
  });

  it('No click clears pending control and adds denied message', async () => {
    const user = userEvent.setup();
    await setup(s.controlRequestBash('r1', { command: 'ls' }));

    // No button is ② or ③ depending on suggestions
    const noButton = screen.getByText(/No$/);
    await user.click(noButton);

    expect(screen.getByRole('status', { name: 'pending-count' })).toHaveTextContent('0');
    expect(screen.getByRole('status', { name: 'last-message' })).toHaveTextContent(/Denied.*Bash/);
  });

  it('shows allow-for-session option when permissionSuggestions present', async () => {
    await setup(s.controlRequestBash('r1', { command: 'ls' }));
    expect(screen.getByText(/allow.*session/i)).toBeInTheDocument();
  });

  it('sends custom deny message from input and clears pending', async () => {
    const user = userEvent.setup();
    await setup(s.controlRequestBash('r1', { command: 'rm' }));
    const input = screen.getByPlaceholderText('Tell Claude what to do instead');
    await user.type(input, 'do not delete{Enter}');

    expect(screen.getByRole('status', { name: 'pending-count' })).toHaveTextContent('0');
    expect(screen.getByRole('status', { name: 'last-message' })).toHaveTextContent(/Denied.*Bash/);
  });

  it('shows Esc to cancel', async () => {
    await setup(s.controlRequest('r1', 'can_use_tool', 'Read', { file_path: '/a.ts' }));
    expect(screen.getByText('Esc to cancel')).toBeInTheDocument();
  });

  it('Read permission shows tool name in header', async () => {
    await setup(s.controlRequest('r1', 'can_use_tool', 'Read', { file_path: '/src/app.ts' }));
    const header = screen.getByText(/proceed with/i);
    expect(header.textContent).toContain('Read');
  });

  it('shows collapsible details when input has properties', async () => {
    await setup(s.controlRequestBash('r1', { command: 'ls -la', description: 'List files' }));
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('hides details when input is empty object', async () => {
    await setup(s.controlRequest('r1', 'can_use_tool', 'CustomTool', {}));
    expect(screen.queryByText('Details')).toBeNull();
  });

  it('keyboard: number key 1 triggers Yes', async () => {
    const user = userEvent.setup();
    await setup(s.controlRequestBash('r1', { command: 'ls' }));
    expect(screen.getByRole('status', { name: 'pending-count' })).toHaveTextContent('1');

    await user.keyboard('1');

    expect(screen.getByRole('status', { name: 'pending-count' })).toHaveTextContent('0');
    expect(screen.getByRole('status', { name: 'last-message' })).toHaveTextContent(
      /Approved.*Bash/,
    );
  });

  it('keyboard: Escape denies permission', async () => {
    const user = userEvent.setup();
    await setup(s.controlRequestBash('r1', { command: 'ls' }));

    await user.keyboard('{Escape}');

    expect(screen.getByRole('status', { name: 'pending-count' })).toHaveTextContent('0');
  });

  it('does not show editable command block when input is undefined', async () => {
    const { container } = await setup(s.controlRequest('r1', 'can_use_tool', 'Bash'));
    expect(container.querySelector('[contenteditable]')).toBeNull();
  });

  it('renders hook callback with Continue/Cancel', async () => {
    await setup(s.controlRequest('r1', 'hook_callback'));
    expect(screen.getByText('Continue')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders multiple pending controls', async () => {
    await setup(
      s.controlRequestBash('r1', { command: 'ls' }),
      s.controlRequest('r2', 'can_use_tool', 'Read', { file_path: '/src/app.ts' }),
    );
    expect(screen.getByRole('status', { name: 'pending-count' })).toHaveTextContent('2');
    expect(screen.getAllByText('Bash').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Read').length).toBeGreaterThan(0);
  });

  it('AskUserQuestion without questions falls back to tool permission', async () => {
    await setup(s.controlRequest('r1', 'can_use_tool', 'AskUserQuestion', {}));
    const yesBtn = screen.getAllByRole('button').find((b) => b.textContent?.includes('Yes'));
    expect(yesBtn).toBeDefined();
  });

  describe('AskUserQuestion in permission container', () => {
    it('renders question content inside permission container', async () => {
      await setup(
        s.controlRequestAskUserQuestion('r1', {
          questions: [
            {
              question: 'Pick?',
              header: 'Choice',
              options: [{ label: 'A', description: 'desc' }],
              multiSelect: false,
            },
          ],
        }),
      );
      // Question visible
      expect(screen.getByText('Pick?')).toBeInTheDocument();
      // "Submit answers" button instead of "Yes"
      const submitBtn = screen
        .getAllByRole('button')
        .find((b) => b.textContent?.includes('Submit'));
      expect(submitBtn).toBeDefined();
    });

    it('hides No button and reject input for AskUserQuestion', async () => {
      await setup(
        s.controlRequestAskUserQuestion('r1', {
          questions: [
            {
              question: 'Q?',
              header: 'H',
              options: [{ label: 'A', description: 'd' }],
              multiSelect: false,
            },
          ],
        }),
      );
      const noBtn = screen.getAllByRole('button').find((b) => b.textContent?.match(/No$/));
      expect(noBtn).toBeUndefined();
      expect(screen.queryByPlaceholderText(/Tell Claude/)).not.toBeInTheDocument();
    });

    it('shows tab navigation for multiple questions', async () => {
      await setup(
        s.controlRequestAskUserQuestion('r1', {
          questions: [
            {
              question: 'Q1?',
              header: 'First',
              options: [{ label: 'A', description: 'd' }],
              multiSelect: false,
            },
            {
              question: 'Q2?',
              header: 'Second',
              options: [{ label: 'X', description: 'd' }],
              multiSelect: false,
            },
          ],
        }),
      );
      expect(screen.getByRole('tab', { name: 'First' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Second' })).toBeInTheDocument();
      // Only first question visible
      expect(screen.getByText('Q1?')).toBeInTheDocument();
      expect(screen.queryByText('Q2?')).not.toBeInTheDocument();
    });

    it('clicking tab switches question', async () => {
      const user = userEvent.setup();
      await setup(
        s.controlRequestAskUserQuestion('r1', {
          questions: [
            {
              question: 'Q1?',
              header: 'First',
              options: [{ label: 'A', description: 'd' }],
              multiSelect: false,
            },
            {
              question: 'Q2?',
              header: 'Second',
              options: [{ label: 'X', description: 'd' }],
              multiSelect: false,
            },
          ],
        }),
      );
      await user.click(screen.getByRole('tab', { name: 'Second' }));
      expect(screen.queryByText('Q1?')).not.toBeInTheDocument();
      expect(screen.getByText('Q2?')).toBeInTheDocument();
    });
  });
});
