import { segments as s } from '@code-quest/summoner/test';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useChannelControl, useChannelMessages } from '../../contexts/channel';
import { renderWithChannel } from '../../test/render-with-channel';
import { PendingActionBanner } from '../PendingActionBanner';

function BannerWithState() {
  const { pendingControls } = useChannelControl();
  const { messages } = useChannelMessages();
  return (
    <div>
      <span data-testid="pending-count">{pendingControls.length}</span>
      <span data-testid="last-message">{messages[messages.length - 1]?.content ?? ''}</span>
      <PendingActionBanner />
    </div>
  );
}

async function setup(...controlSegments: string[]) {
  const { claude, ...rest } = await renderWithChannel(<BannerWithState />);
  for (const seg of controlSegments) {
    await claude.emit(seg);
  }
  return { claude, ...rest };
}

describe('PendingActionBanner', () => {
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
    expect(screen.getByTestId('pending-count')).toHaveTextContent('1');

    const yesBtn = screen.getAllByRole('button').find((b) => b.textContent?.match(/①.*Yes/));
    await user.click(yesBtn!);

    expect(screen.getByTestId('pending-count')).toHaveTextContent('0');
    expect(screen.getByTestId('last-message')).toHaveTextContent(/Approved.*Bash/);
  });

  it('No click clears pending control and adds denied message', async () => {
    const user = userEvent.setup();
    await setup(s.controlRequestBash('r1', { command: 'ls' }));

    // No button is ② or ③ depending on suggestions
    const noButton = screen.getByText(/No$/);
    await user.click(noButton);

    expect(screen.getByTestId('pending-count')).toHaveTextContent('0');
    expect(screen.getByTestId('last-message')).toHaveTextContent(/Denied.*Bash/);
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

    expect(screen.getByTestId('pending-count')).toHaveTextContent('0');
    expect(screen.getByTestId('last-message')).toHaveTextContent(/Denied.*Bash/);
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
    expect(screen.getByTestId('pending-count')).toHaveTextContent('1');

    await user.keyboard('1');

    expect(screen.getByTestId('pending-count')).toHaveTextContent('0');
    expect(screen.getByTestId('last-message')).toHaveTextContent(/Approved.*Bash/);
  });

  it('keyboard: Escape denies permission', async () => {
    const user = userEvent.setup();
    await setup(s.controlRequestBash('r1', { command: 'ls' }));

    await user.keyboard('{Escape}');

    expect(screen.getByTestId('pending-count')).toHaveTextContent('0');
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
    expect(screen.getByTestId('pending-count')).toHaveTextContent('2');
    expect(screen.getAllByText('Bash').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Read').length).toBeGreaterThan(0);
  });

  it('AskUserQuestion without questions falls back to tool permission', async () => {
    await setup(s.controlRequest('r1', 'can_use_tool', 'AskUserQuestion', {}));
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });
});
