import { createFakeServer } from '@code-quest/server/test';
import { type FakeClaude, segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import { useChannelMessages } from '../contexts/channel/index.ts';
import { createFakeSummoner } from './fake-summoner.ts';

export type { FakeSummoner } from './fake-summoner.ts';

/** Create a shared FakeServer with two connected summoners and an initialized session. */
export async function setupClientWindows(
  serverOpts?: Parameters<typeof createFakeServer>[0],
): Promise<{
  server: ReturnType<typeof createFakeServer>;
  windowA: ReturnType<typeof createFakeSummoner>;
  windowB: ReturnType<typeof createFakeSummoner>;
  channelId: string;
}> {
  const server = createFakeServer(serverOpts);
  const windowA = createFakeSummoner(server);
  const windowB = createFakeSummoner(server);
  const channelId = await windowA.claude().initialize(s.init('cli-sess'));
  return { server, windowA, windowB, channelId };
}

/** Send session:join and flush microtasks. */
export async function joinChannel(
  summoner: ReturnType<typeof createFakeSummoner>,
  channelId: string,
): Promise<void> {
  await act(async () => {
    await summoner.send('session:join', { channelId });
    await new Promise<void>((r) => queueMicrotask(r));
  });
}

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
    await claude.emitSegment(s.assistant(message));
    await claude.emitSegment(s.result());
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
    await claude.emitSegment(segment);
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
