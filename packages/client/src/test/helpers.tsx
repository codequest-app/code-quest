import { type FakeClaude, segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import { useChannelMessages } from '../contexts/channel/index.ts';

/** Placeholder regex for the compose textarea — use this instead of hardcoded strings. */
export const COMPOSE_PLACEHOLDER: RegExp = /Esc to focus/i;

/** Test helper: renders a button that calls sendMessage when clicked. */
export function SendButton({ message = 'test' }: { message?: string } = {}): React.JSX.Element {
  const { sendMessage } = useChannelMessages();
  return (
    <button type="button" onClick={() => sendMessage(message)}>
      TriggerSend
    </button>
  );
}

/** Emit a complete assistant turn (assistant message + result). Wraps with act() for React. */
export async function emitAssistantTurn(claude: FakeClaude, message = 'hi'): Promise<void> {
  await act(async () => {
    await claude.emit(s.assistant(message));
    await claude.emit(s.result());
  });
}

/** Emit a real CLI user-echo segment (loaded from REAL fixture in summoner). Returns the uuid emitted. */
export async function emitUserEcho(
  claude: FakeClaude,
  text: string,
  uuid?: string,
): Promise<string> {
  const segment = s.user(text, uuid ? { uuid } : undefined);
  await act(async () => {
    await claude.emit(segment);
  });
  return JSON.parse(segment).uuid as string;
}

/** Type a message in the compose textarea and press Enter. */
export async function sendUserMessage(
  user: ReturnType<typeof userEvent.setup>,
  text = 'go',
): Promise<void> {
  const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
  await user.click(textarea);
  await user.type(textarea, text);
  await user.keyboard('{Enter}');
}
