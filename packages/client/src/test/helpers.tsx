import { segments as s } from '@code-quest/summoner/test';
import { screen } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import { useChannelMessages } from '../contexts/channel';
import type { FakeClaude } from './fake-claude';

/** Placeholder regex for the compose textarea — use this instead of hardcoded strings. */
export const COMPOSE_PLACEHOLDER = /Esc to focus/i;

/** Test helper: renders a button that calls sendMessage when clicked. */
export function SendButton({ message = 'test' }: { message?: string } = {}) {
  const { sendMessage } = useChannelMessages();
  return (
    <button type="button" onClick={() => sendMessage(message)}>
      TriggerSend
    </button>
  );
}

/** Emit a complete assistant turn (assistant message + result). */
export async function emitAssistantTurn(claude: FakeClaude, message = 'hi') {
  await claude.emit(s.assistant(message));
  await claude.emit(s.result());
}

/** Type a message in the compose textarea and press Enter. */
export async function sendUserMessage(user: ReturnType<typeof userEvent.setup>, text = 'go') {
  const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
  await user.click(textarea);
  await user.type(textarea, text);
  await user.keyboard('{Enter}');
}
