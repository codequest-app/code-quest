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

  describe('chat:stop_task', () => {
    it('sends stop_task control_request to CLI', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:stop_task', { channelId, taskId: 'task-1' });

      expect(
        claude
          .received('control_request')
          .some((r: any) => (r.request as any)?.subtype === 'stop_task'),
      ).toBe(true);
    });
  });

  it('silently ignores control_response for unknown requestId', async () => {
    const claude = createFakeClaude();

    await claude.send('chat:respond', {
      requestId: 'req-1',
      response: { behavior: 'allow', updatedInput: {} },
    });

    // No error — test passes if we reach here
  });

  it('first chat:cancel sends interrupt, second chat:cancel aborts', async () => {
    const { claude, channelId } = await setup();

    // First cancel → interrupt (sends interrupt JSON via stdin)
    await claude.send('chat:cancel', { channelId });

    const afterFirst = claude
      .received()
      .filter((r: any) => JSON.stringify(r).includes('"interrupt"'));
    expect(afterFirst.length).toBeGreaterThan(0);

    // Second cancel → abort
    await claude.send('chat:cancel', { channelId });

    expect(claude.handle.signal.aborted).toBe(true);
  });

  it('after session returns to idle, next cancel is graceful interrupt (not force abort)', async () => {
    const { claude, channelId } = await setup();

    // Turn 1: send message
    await claude.send('chat:send', { channelId, message: 'go' });

    await claude.emit(s.assistant('turn1'));
    await claude.emit(s.result());

    // Turn 2: cancel should be graceful (not abort) since session returned to idle
    await claude.send('chat:send', { channelId, message: 'go again' });

    await claude.send('chat:cancel', { channelId });

    expect(claude.handle.signal.aborted).toBe(false);
  });

  it('interrupts a session', async () => {
    const { claude, channelId } = await setup();

    await claude.send('chat:cancel', { channelId });

    const received = claude.received();
    expect(received.some((r: any) => JSON.stringify(r).includes('"interrupt"'))).toBe(true);
  });

  it('cancel_request C→S calls respondToControlRequest with deny to unblock CLI', async () => {
    const { claude, channelId } = await setup();

    await claude.send('chat:send', { channelId, message: 'go' });

    claude.emit(
      s.assistant({ toolUse: { id: 'toolu_cancel', name: 'Bash', input: { command: 'ls' } } }),
    );
    await claude.emit(
      s.controlRequest('req-cancel-test', 'can_use_tool', 'Bash', { command: 'ls' }),
    );

    await claude.send('chat:cancel_request', { targetRequestId: 'req-cancel-test' });

    const received = claude.received();
    expect(
      received.some(
        (r: any) =>
          JSON.stringify(r).includes('req-cancel-test') && JSON.stringify(r).includes('"deny"'),
      ),
    ).toBe(true);
  });

  it('cancel_request C→S is received by server without error', async () => {
    const { claude, channelId } = await setup();

    await claude.send('chat:send', { channelId, message: 'go' });
    await claude.emit(
      s.assistant({ toolUse: { id: 'toolu_c', name: 'Bash', input: { command: 'ls' } } }),
    );
    await claude.emit(s.controlRequest('req-cancel-cs', 'can_use_tool', 'Bash', { command: 'ls' }));

    await claude.send('chat:cancel_request', { targetRequestId: 'req-cancel-cs' });

    expect(claude.socket.connected).toBe(true);
  });
});
