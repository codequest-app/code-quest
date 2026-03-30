/* biome-ignore-all lint/suspicious/noExplicitAny: test file uses type assertions */
import { segments as s } from '@code-quest/summoner/test';
import type { RawEventStore } from '../services/raw-event-store.ts';
import { createFakeClaude } from '../test/index.ts';
import { TYPES } from '../types.ts';

async function setup(sessionId = 'cli-sess') {
  const claude = createFakeClaude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { claude, channelId };
}

function collectEvents(socket: any, eventName: string) {
  const events: any[] = [];
  socket.on(eventName, (p: any) => events.push(p));
  return events;
}

describe('ChatHandler > message', () => {
  it('second window receives user message from emitToOthers', async () => {
    const { claude, channelId } = await setup();

    // Second browser window joins the same channel
    const socket2 = claude.connect();
    await new Promise<void>((resolve) => {
      socket2.emit('session:join', { channelId }, () => resolve());
    });

    const socket2UserEvents = collectEvents(socket2, 'message:user');

    // Window A sends a message
    await claude.send('chat:send', { channelId, message: 'hello from A' });

    // socket2 should receive the user message via emitToOthers
    expect(socket2UserEvents.length).toBeGreaterThan(0);
    expect(socket2UserEvents[0].content[0]).toMatchObject({
      type: 'text',
      text: 'hello from A',
    });
  });

  it('sender does not receive own user message via emitToOthers', async () => {
    const { claude, channelId } = await setup();

    // Second browser window joins the same channel
    const socket2 = claude.connect();
    await new Promise<void>((resolve) => {
      socket2.emit('session:join', { channelId }, () => resolve());
    });

    const senderUserEvents = collectEvents(claude.socket, 'message:user');

    // Window A sends a message — emitToOthers excludes the sender
    await claude.send('chat:send', { channelId, message: 'hello from A' });

    // Sender should NOT receive message:user from emitToOthers
    // (sender adds user message locally via sendMessage action)
    expect(
      senderUserEvents.filter((e: any) => e.content?.[0]?.text === 'hello from A').length,
    ).toBe(0);
  });

  it('sends message and receives assistant text via chat:event', async () => {
    const { claude, channelId } = await setup();
    const events = collectEvents(claude.socket, 'message:assistant');

    await claude.send('chat:send', { channelId, message: 'hi' });

    await claude.emit(s.assistant('Hello!'));
    await claude.emit(s.result());

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].content[0]).toMatchObject({ type: 'text', text: 'Hello!' });
  });

  it('forwards tool_use and tool_result events through control_request flow', async () => {
    const { claude, channelId } = await setup();
    const permEvents = collectEvents(claude.socket, 'control:permission');
    const userEvents = collectEvents(claude.socket, 'message:user');
    const assistantEvents = collectEvents(claude.socket, 'message:assistant');
    const resultEvents = collectEvents(claude.socket, 'message:result');

    await claude.send('chat:send', { channelId, message: 'read file' });

    claude.emit(
      s.assistant({ toolUse: { id: 'toolu_1', name: 'Read', input: { file_path: '/tmp/x' } } }),
    );
    await claude.emit(s.controlRequest('req-1', 'can_use_tool', 'Read', { file_path: '/tmp/x' }));

    expect(permEvents.length).toBeGreaterThan(0);

    await claude.send('chat:respond', {
      channelId,
      requestId: 'req-1',
      response: { behavior: 'allow', updatedInput: {} },
    });

    await claude.emit(s.toolResult('toolu_1', 'file content'));
    await claude.emit(s.assistant('Done'));
    await claude.emit(s.result());

    expect(userEvents.length).toBeGreaterThan(0);
    const texts = assistantEvents.map((e: any) => e.content?.[0]?.text).filter(Boolean);
    expect(texts).toContain('Done');
    expect(resultEvents.length).toBeGreaterThan(0);
  });

  it('emits stream:text for streamlined_text', async () => {
    const { claude, channelId } = await setup();
    const textEvents = collectEvents(claude.socket, 'stream:text');

    await claude.send('chat:send', { channelId, message: 'go' });
    await claude.emit(s.streamlinedText('fast mode text'));

    expect(textEvents.length).toBeGreaterThan(0);
    expect(textEvents[0].text).toBe('fast mode text');
  });

  it('persists raw events to store', async () => {
    const { claude, channelId } = await setup();

    await claude.send('chat:send', { channelId, message: 'hello' });

    await claude.emit(s.assistant('ok'));
    await claude.emit(s.result());

    const rawEventStore = claude.container.get<RawEventStore>(TYPES.RawEventStore);
    const stored = await rawEventStore.getBySession('cli-sess');
    expect(stored.length).toBeGreaterThan(0);
  });

  it('silently ignores send_message for unknown session', async () => {
    const claude = createFakeClaude();

    await claude.send('chat:send', { channelId: 'unknown', message: 'hi' });

    // No error — test passes if we reach here
  });
});
