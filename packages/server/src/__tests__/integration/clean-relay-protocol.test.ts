/* biome-ignore-all lint/suspicious/noExplicitAny: test file */
import { segments as s } from '@code-quest/summoner/test';
import { describe, expect, it } from 'vitest';
import { createFakeClaude } from '../../test/index.ts';

async function setup(sessionId = 'relay-protocol') {
  const claude = createFakeClaude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { claude, channelId };
}

function collectEvents(socket: any, eventName: string) {
  const events: any[] = [];
  socket.on(eventName, (payload: any) => events.push(payload));
  return events;
}

describe('Cycle 1: named socket events', () => {
  it('1.1 assistant message emitted via message:assistant', async () => {
    const { claude, channelId } = await setup();
    const msgEvents = collectEvents(claude.socket, 'message:assistant');

    await claude.send('chat:send', { channelId, message: 'hi' });
    await claude.emit(s.assistant('hello'));
    await claude.emit(s.result());

    const msg = msgEvents.find((e: any) => e.channelId === channelId);
    expect(msg).toBeDefined();
    expect(msg.content[0].type).toBe('text');
  });

  it('1.2 permission_request emitted via control:permission', async () => {
    const { claude, channelId } = await setup();
    const controlEvents = collectEvents(claude.socket, 'control:permission');

    await claude.send('chat:send', { channelId, message: 'go' });
    await claude.emit(
      s.assistant({ toolUse: { id: 'toolu_1', name: 'Bash', input: { command: 'ls' } } }),
    );
    await claude.emit(s.controlRequest('req-1', 'can_use_tool', 'Bash', { command: 'ls' }));

    const perm = controlEvents.find((e: any) => e.channelId === channelId);
    expect(perm).toBeDefined();
    expect(perm.toolName).toBe('Bash');
    expect(perm.requestId).toBe('req-1');
  });

  it('1.3 permission_request input field is NOT renamed to inputs', async () => {
    const { claude, channelId } = await setup();
    const controlEvents = collectEvents(claude.socket, 'control:permission');

    await claude.send('chat:send', { channelId, message: 'go' });
    await claude.emit(
      s.assistant({ toolUse: { id: 'toolu_1', name: 'Bash', input: { command: 'ls' } } }),
    );
    await claude.emit(s.controlRequest('req-1', 'can_use_tool', 'Bash', { command: 'ls' }));

    const perm = controlEvents.find((e: any) => e.channelId === channelId);
    expect(perm).toBeDefined();
    expect(perm.input).toEqual({ command: 'ls' });
    expect((perm as any).inputs).toBeUndefined();
  });
});

describe('Cycle 2: session:* lifecycle', () => {
  it('2.1 launch session emits session:created', async () => {
    const claude = createFakeClaude();
    const sessionEvents = collectEvents(claude.socket, 'session:created');

    const channelId = await claude.initialize();

    expect(sessionEvents.length).toBeGreaterThan(0);
    expect(sessionEvents[0].channelId).toBe(channelId);
  });

  it('2.2 session exit emits session:closed', async () => {
    const { claude, channelId } = await setup();
    const closedEvents = collectEvents(claude.socket, 'session:closed');

    claude.handle.abort();
    await new Promise<void>((r) => queueMicrotask(r));

    expect(closedEvents.length).toBeGreaterThan(0);
    expect(closedEvents[0].channelId).toBe(channelId);
  });

  it('2.3 client can join channel via session:join', async () => {
    const { claude, channelId } = await setup();

    const joinResult = await claude.send<any>('session:join', { channelId });

    expect(joinResult.channelId).toBe(channelId);
    expect(joinResult.error).toBeUndefined();
  });
});

describe('Cycle 3: chat:send / chat:respond', () => {
  it('3.1 client emit chat:send delivers message to CLI', async () => {
    const { claude, channelId } = await setup();
    const assistantMsgs = collectEvents(claude.socket, 'message:assistant');

    await claude.send('chat:send', { channelId, message: 'hello' });
    await claude.emit(s.assistant('reply'));
    await claude.emit(s.result());

    expect(assistantMsgs.length).toBeGreaterThan(0);
  });

  it('3.2 client emit chat:respond resolves permission request', async () => {
    const { claude, channelId } = await setup();
    const permEvents = collectEvents(claude.socket, 'control:permission');
    const assistantMsgs = collectEvents(claude.socket, 'message:assistant');

    await claude.send('chat:send', { channelId, message: 'run ls' });
    await claude.emit(
      s.assistant({ toolUse: { id: 'toolu_1', name: 'Bash', input: { command: 'ls' } } }),
    );
    await claude.emit(s.controlRequest('req-1', 'can_use_tool', 'Bash', { command: 'ls' }));

    expect(permEvents.length).toBeGreaterThan(0);

    // Respond
    await claude.send('chat:respond', {
      channelId,
      requestId: 'req-1',
      response: { behavior: 'allow' },
    });
    await claude.emit(s.toolResult('toolu_1', 'file.txt'));
    await claude.emit(s.assistant('done'));
    await claude.emit(s.result());

    const doneMsg = assistantMsgs.find((e: any) =>
      e.content?.some?.((b: any) => b.type === 'text' && b.text === 'done'),
    );
    expect(doneMsg).toBeDefined();
  });

  it('3.3 client emit chat:respond resolves elicitation request', async () => {
    const { claude, channelId } = await setup();
    const elicitEvents = collectEvents(claude.socket, 'control:elicitation');

    await claude.send('chat:send', { channelId, message: 'go' });
    await claude.emit(s.assistant('I need input'));
    await claude.emit(s.controlRequestElicitation('elicit-1', { message: 'Enter URL' }));

    expect(elicitEvents.length).toBeGreaterThan(0);

    await claude.send('chat:respond', {
      requestId: 'elicit-1',
      response: { behavior: 'allow', updatedInput: { url: 'https://example.com' } },
    });

    // control_response should have been sent to Claude
    expect(claude.received('control_response').length).toBeGreaterThan(0);
  });
});

describe('Cycle 4: session:launch / session:close', () => {
  it('4.1 client emit session:launch starts CLI process', async () => {
    const claude = createFakeClaude();
    const sessionEvents = collectEvents(claude.socket, 'session:created');

    const channelId = await claude.initialize();

    expect(channelId).toBeTruthy();
    expect(sessionEvents.length).toBeGreaterThan(0);
  });

  it('4.2 client emit session:close kills channel', async () => {
    const { claude, channelId } = await setup();

    await claude.send('session:close', { channelId });

    expect(claude.handle.signal.aborted).toBe(true);
  });
});

describe('Cycle 5: state:update / session:states', () => {
  it('5.1 session_init broadcasts state:update', async () => {
    const claude = createFakeClaude();
    const configEvents = collectEvents(claude.socket, 'state:update');
    await claude.initialize();

    expect(configEvents.length).toBeGreaterThan(0);
  });

  it('5.2 session state change broadcasts session:states', async () => {
    const claude = createFakeClaude();
    const statesEvents = collectEvents(claude.socket, 'session:states');
    await claude.initialize();

    expect(statesEvents.length).toBeGreaterThan(0);
    expect(statesEvents[0].sessions).toBeDefined();
    expect(Array.isArray(statesEvents[0].sessions)).toBe(true);
  });
});
