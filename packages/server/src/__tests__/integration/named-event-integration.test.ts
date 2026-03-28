/* biome-ignore-all lint/suspicious/noExplicitAny: test file */
import { segments as s } from '@code-quest/summoner/test';
import { describe, expect, it } from 'vitest';
import { createFakeClaude } from '../../test/index.ts';

async function setup() {
  const claude = createFakeClaude();
  const channelId = await claude.initialize(s.init('client-event-integ'));
  return { claude, channelId };
}

function collectEvents(socket: any, eventName: string) {
  const events: any[] = [];
  socket.on(eventName, (payload: any) => events.push(payload));
  return events;
}

describe('named socket event integration', () => {
  it('emits session:init on launch', async () => {
    const claude = createFakeClaude();
    const events = collectEvents(claude.socket, 'session:init');

    await claude.initialize(s.init('client-event-integ'));

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].sessionId).toBe('client-event-integ');
  });

  it('emits message:assistant + message:result after sendMessage', async () => {
    const { claude, channelId } = await setup();
    const assistantEvents = collectEvents(claude.socket, 'message:assistant');
    const resultEvents = collectEvents(claude.socket, 'message:result');

    await claude.send('chat:send', { channelId, message: 'hi' });
    await claude.emit(s.assistant('hello'));
    await claude.emit(s.result());

    expect(assistantEvents.length).toBeGreaterThan(0);
    const content = assistantEvents[0].content as Array<{ type: string; text: string }>;
    expect(content[0]).toMatchObject({ type: 'text', text: 'hello' });
    expect(resultEvents.length).toBeGreaterThan(0);
  });

  it('emits control:permission for can_use_tool', async () => {
    const { claude, channelId } = await setup();
    const permEvents = collectEvents(claude.socket, 'control:permission');

    await claude.send('chat:send', { channelId, message: 'go' });
    await claude.emit(
      s.assistant({ toolUse: { id: 'toolu_1', name: 'Bash', input: { command: 'ls' } } }),
    );
    await claude.emit(s.controlRequest('req-1', 'can_use_tool', 'Bash', { command: 'ls' }));

    expect(permEvents.length).toBeGreaterThan(0);
    expect(permEvents[0].toolName).toBe('Bash');
    expect(permEvents[0].requestId).toBe('req-1');
  });

  it('forwards hook_callback as control:hook_callback', async () => {
    const { claude, channelId } = await setup();
    const hookEvents = collectEvents(claude.socket, 'control:hook_callback');

    await claude.send('chat:send', { channelId, message: 'go' });
    await claude.emit(s.controlRequest('hook-1', 'hook_callback'));

    expect(hookEvents.length).toBeGreaterThan(0);
  });

  it('emits stream:text for streamlined_text', async () => {
    const { claude, channelId } = await setup();
    const textEvents = collectEvents(claude.socket, 'stream:text');

    await claude.send('chat:send', { channelId, message: 'go' });
    await claude.emit(s.streamlinedText('fast mode text'));

    expect(textEvents.length).toBeGreaterThan(0);
    expect(textEvents[0].text).toBe('fast mode text');
  });

  it('named events fire for display events', async () => {
    const { claude, channelId } = await setup();
    const assistantMsgs = collectEvents(claude.socket, 'message:assistant');

    await claude.send('chat:send', { channelId, message: 'go' });
    await claude.emit(s.assistant('dual'));
    await claude.emit(s.result());

    expect(assistantMsgs.length).toBeGreaterThanOrEqual(1);
    expect(assistantMsgs[0].content).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'text' })]),
    );
  });
});
