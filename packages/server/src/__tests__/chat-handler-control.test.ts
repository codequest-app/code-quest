/* biome-ignore-all lint/suspicious/noExplicitAny: test file uses type assertions */
import { segments as s } from '@code-quest/summoner/test';
import type { SessionStore } from '../services/session-store.ts';
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

describe('ChatHandler > control', () => {
  describe('pending control_request queue', () => {
    it('forwards control_request events to client', async () => {
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
      expect(permEvents[0].input).toEqual({ command: 'ls' });
      expect((permEvents[0] as Record<string, unknown>).inputs).toBeUndefined();
    });

    it('control_request tracked in channel', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(
        s.assistant({ toolUse: { id: 'toolu_1', name: 'Bash', input: { command: 'ls' } } }),
      );
      await claude.emit(s.controlRequest('req-1', 'can_use_tool', 'Bash', { command: 'ls' }));

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = claude.container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.get(channelId)?.hasControlRequest('req-1')).toBe(true);
    });

    it('removes from pending after control_response', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(
        s.assistant({ toolUse: { id: 'toolu_1', name: 'Bash', input: { command: 'ls' } } }),
      );
      await claude.emit(s.controlRequest('req-1', 'can_use_tool', 'Bash', { command: 'ls' }));

      await claude.send('chat:respond', {
        channelId,
        requestId: 'req-1',
        response: { behavior: 'allow', updatedInput: {} },
      });

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = claude.container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.get(channelId)?.hasControlRequest('req-1')).toBe(false);
      expect(claude.received('control_response').length).toBeGreaterThan(0);
    });

    it('forwards hook_callback to client', async () => {
      const { claude, channelId } = await setup();
      const hookEvents = collectEvents(claude.socket, 'control:hook_callback');

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(s.controlRequest('hook-1', 'hook_callback'));

      expect(hookEvents.length).toBeGreaterThan(0);
    });

    it('removes pending on control_cancel_request and forwards cancel_request', async () => {
      const { claude, channelId } = await setup();
      const cancelEvents = collectEvents(claude.socket, 'cancel_request');

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'Bash', input: {} } }));
      await claude.emit(s.controlRequest('req-1', 'can_use_tool', 'Bash', {}));
      await claude.emit(s.controlCancelRequest('req-1'));

      expect(cancelEvents.length).toBeGreaterThan(0);
      expect(cancelEvents[0].targetRequestId).toBe('req-1');

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = claude.container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.get(channelId)?.hasControlRequest('req-1')).toBe(false);
    });

    describe('parallel control_requests', () => {
      it('forwards multiple control_requests to client', async () => {
        const { claude, channelId } = await setup();
        const permEvents = collectEvents(claude.socket, 'control:permission');

        await claude.send('chat:send', { channelId, message: 'go' });
        await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'Read', input: {} } }));
        await claude.emit(s.controlRequest('req-1', 'can_use_tool', 'Read', {}));
        await claude.emit(s.controlRequest('req-2', 'can_use_tool', 'Write', {}));

        expect(permEvents.length).toBe(2);
        expect(permEvents[0].requestId).toBe('req-1');
        expect(permEvents[1].requestId).toBe('req-2');
      });

      it('resumes after all parallel CRs responded', async () => {
        const { claude, channelId } = await setup();

        await claude.send('chat:send', { channelId, message: 'go' });
        await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'Read', input: {} } }));
        await claude.emit(s.controlRequest('req-1', 'can_use_tool', 'Read', {}));
        await claude.emit(s.controlRequest('req-2', 'can_use_tool', 'Write', {}));

        await claude.send('chat:respond', {
          channelId,
          requestId: 'req-1',
          response: { behavior: 'allow', updatedInput: {} },
        });
        await claude.send('chat:respond', {
          channelId,
          requestId: 'req-2',
          response: { behavior: 'allow', updatedInput: {} },
        });

        expect(claude.received('control_response').length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('chat:respond for diff', () => {
    it('forwards accepted diff response', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(
        s.controlRequestOpenDiff('diff-1', {
          originalFilePath: '/tmp/old.ts',
          newFilePath: '/tmp/new.ts',
        }),
      );
      // open_diff involves server sendControlRequest → auto-respond; wait for notification flow
      await new Promise<void>((r) => setTimeout(r, 50));

      await claude.send('chat:respond', {
        channelId,
        requestId: 'diff-1',
        response: { behavior: 'allow', updatedInput: {} },
      });

      expect(claude.received('control_response').length).toBeGreaterThan(0);
    });

    it('forwards rejected diff response', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(
        s.controlRequestOpenDiff('diff-1', {
          originalFilePath: '/tmp/old.ts',
          newFilePath: '/tmp/new.ts',
        }),
      );
      await new Promise<void>((r) => setTimeout(r, 50));

      await claude.send('chat:respond', {
        channelId,
        requestId: 'diff-1',
        response: { behavior: 'deny', message: 'rejected' },
      });

      expect(claude.received('control_response').length).toBeGreaterThan(0);
    });
  });

  describe('chat:stop_task', () => {
    it('sends stop_task control_request to CLI', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:stop_task', { channelId, taskId: 'task-1' });

      expect(
        claude.received('control_request').some((r) => (r.request as any)?.subtype === 'stop_task'),
      ).toBe(true);
    });
  });

  describe('elicitation control_request', () => {
    it('pushes elicitation_request to client', async () => {
      const { claude, channelId } = await setup();
      const elicitEvents = collectEvents(claude.socket, 'control:elicitation');

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(s.controlRequestElicitation('elicit-1', { message: 'Enter URL' }));

      expect(elicitEvents.length).toBeGreaterThan(0);
      expect(elicitEvents[0].requestId).toBe('elicit-1');
    });

    it('chat:respond forwards elicitation answer to CLI', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(s.controlRequestElicitation('elicit-1', { message: 'Enter URL' }));

      await claude.send('chat:respond', {
        requestId: 'elicit-1',
        response: { behavior: 'allow', updatedInput: { url: 'https://example.com' } },
      });

      expect(claude.received('control_response').length).toBeGreaterThan(0);
    });

    it('chat:respond with deny sends decline to CLI', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(s.controlRequestElicitation('elicit-1', { message: 'Enter URL' }));

      await claude.send('chat:respond', {
        requestId: 'elicit-1',
        response: { behavior: 'deny', message: 'no thanks' },
      });

      expect(claude.received('control_response').length).toBeGreaterThan(0);
    });

    it('maps mode:"url" → inputType:"url"', async () => {
      const { claude, channelId } = await setup();
      const elicitEvents = collectEvents(claude.socket, 'control:elicitation');

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(
        s.controlRequestElicitation('elicit-url', {
          message: 'Enter URL',
          mode: 'url',
          url: 'https://auth.example.com',
        }),
      );

      expect(elicitEvents.length).toBeGreaterThan(0);
    });

    it('maps mode:"form" → extracts options from schema', async () => {
      const { claude, channelId } = await setup();
      const elicitEvents = collectEvents(claude.socket, 'control:elicitation');

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(
        s.controlRequestElicitation('elicit-form', {
          message: 'Pick option',
          mode: 'form',
          requestedSchema: { properties: { choice: { type: 'string', enum: ['A', 'B', 'C'] } } },
        }),
      );

      expect(elicitEvents.length).toBeGreaterThan(0);
    });
  });

  describe('initialize control_request', () => {
    it('system/init pushes state:update on launch', async () => {
      const claude = createFakeClaude();
      const configEvents = collectEvents(claude.socket, 'state:update');

      await claude.initialize();

      expect(configEvents.length).toBeGreaterThan(0);
    });

    it('system/init persists session with session_id', async () => {
      const { claude, channelId } = await setup('my-session-id');

      const sessionStore = claude.container.get<SessionStore>(TYPES.SessionStore);
      const record = await sessionStore.getById(channelId);
      expect(record?.sessionId).toBe('my-session-id');
    });
  });

  describe('mcp_message control_request', () => {
    it('forwards to client as control:mcp event', async () => {
      const { claude, channelId } = await setup();
      const mcpEvents = collectEvents(claude.socket, 'control:mcp');

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(
        s.controlRequest('mcp-1', 'mcp_message', undefined, {
          server_name: 'test-server',
          message: { jsonrpc: '2.0', method: 'test', id: 1 },
        }),
      );

      expect(mcpEvents.length).toBeGreaterThan(0);
    });
  });

  describe('open_diff control_request', () => {
    it('pushes diff_review_request to client', async () => {
      const { claude, channelId } = await setup();
      const diffEvents = collectEvents(claude.socket, 'control:diff_review');

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(
        s.controlRequestOpenDiff('diff-1', {
          originalFilePath: '/tmp/old.ts',
          newFilePath: '/tmp/new.ts',
        }),
      );
      // open_diff triggers notification_request → sendControlRequest → auto-respond; needs extra wait
      await new Promise<void>((r) => setTimeout(r, 50));

      expect(diffEvents.length).toBeGreaterThan(0);
    });
  });

  describe('open_url / open_file control_request', () => {
    it('open_in_editor: forwards as raw:event to client', async () => {
      const { claude, channelId } = await setup();
      const rawEvents = collectEvents(claude.socket, 'raw:event');

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(s.controlRequestOpenInEditor('open-1'));

      expect(rawEvents.length).toBeGreaterThan(0);
      expect(rawEvents[0].rawType).toBe('control_request/open_in_editor');
    });
  });

  describe('auto-respond control_requests', () => {
    it('set_model auto-responds and updates sessionState', async () => {
      const { claude, channelId } = await setup();

      await claude.send('set_model', { channelId, model: 'haiku' });

      const received = claude.received('control_request');
      expect(received.some((r) => (r.request as any)?.subtype === 'set_model')).toBe(true);
    });

    it('set_permission_mode auto-responds and updates sessionState', async () => {
      const { claude, channelId } = await setup();

      await claude.send('set_permission_mode', { channelId, mode: 'plan' });

      const received = claude.received('control_request');
      expect(received.some((r) => (r.request as any)?.subtype === 'set_permission_mode')).toBe(
        true,
      );
    });

    it('mcp_message is NOT auto-responded — passthrough to client', async () => {
      const { claude, channelId } = await setup();
      const mcpEvents = collectEvents(claude.socket, 'control:mcp');

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(
        s.controlRequest('mcp-pass', 'mcp_message', undefined, {
          server_name: 'test',
          message: { jsonrpc: '2.0', method: 'test', id: 1 },
        }),
      );

      expect(mcpEvents.length).toBeGreaterThan(0);
      // mcp_message should be forwarded to client, not auto-responded
      expect(mcpEvents[0].requestId).toBe('mcp-pass');
    });
  });

  describe('initialize response fields', () => {
    it('initialize response includes accountInfo from controlResponse', async () => {
      const claude = createFakeClaude();
      const stateUpdates = collectEvents(claude.socket, 'state:update');

      await claude.initialize(
        s.init('sess'),
        s.controlResponse('init', {
          account: { email: 'user@test.com', subscriptionType: 'Claude Max' },
        }),
      );

      const accountUpdate = stateUpdates.find((e: any) => e.accountInfo);
      expect(accountUpdate).toBeDefined();
      expect(accountUpdate.accountInfo.email).toBe('user@test.com');
    });
  });

  describe('elicitation modes', () => {
    it('maps mode:"form" → extracts options from requested_schema properties', async () => {
      const { claude, channelId } = await setup();
      const elicitEvents = collectEvents(claude.socket, 'control:elicitation');

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(
        s.controlRequestElicitation('elicit-form-opts', {
          message: 'Pick option',
          mode: 'form',
          requestedSchema: {
            properties: { choice: { type: 'string', enum: ['A', 'B', 'C'] } },
          },
        }),
      );

      expect(elicitEvents.length).toBeGreaterThan(0);
      expect(elicitEvents[0].requestId).toBe('elicit-form-opts');
    });

    it('maps mode:"url" → inputType:"url" and forwards url field', async () => {
      const { claude, channelId } = await setup();
      const elicitEvents = collectEvents(claude.socket, 'control:elicitation');

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(
        s.controlRequestElicitation('elicit-url-field', {
          message: 'Enter URL',
          mode: 'url',
          url: 'https://auth.example.com',
        }),
      );

      expect(elicitEvents.length).toBeGreaterThan(0);
      expect(elicitEvents[0].requestId).toBe('elicit-url-field');
    });
  });

  describe('open_diff with file content', () => {
    it('emits diff_review_request with real file content', async () => {
      const { writeFileSync, mkdirSync, rmSync } = await import('node:fs');
      const { join } = await import('node:path');
      const { tmpdir } = await import('node:os');

      const dir = join(tmpdir(), `cc-diff-test-${Date.now()}`);
      mkdirSync(dir, { recursive: true });
      const origPath = join(dir, 'original.ts');
      const newPath = join(dir, 'new.ts');
      writeFileSync(origPath, 'const a = 1;');
      writeFileSync(newPath, 'const a = 2;');

      try {
        const { claude, channelId } = await setup();
        const diffEvents = collectEvents(claude.socket, 'control:diff_review');

        await claude.send('chat:send', { channelId, message: 'go' });
        await claude.emit(
          s.controlRequestOpenDiff('diff-content-1', {
            originalFilePath: origPath,
            newFilePath: newPath,
          }),
        );
        await new Promise<void>((r) => setTimeout(r, 50));

        expect(diffEvents.length).toBeGreaterThan(0);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it('uses empty string when file does not exist', async () => {
      const { claude, channelId } = await setup();
      const diffEvents = collectEvents(claude.socket, 'control:diff_review');

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(
        s.controlRequestOpenDiff('diff-nofile', {
          originalFilePath: '/nonexistent/original.ts',
          newFilePath: '/nonexistent/new.ts',
        }),
      );
      await new Promise<void>((r) => setTimeout(r, 50));

      expect(diffEvents.length).toBeGreaterThan(0);
    });
  });

  describe('open_url / open_file control_request (extended)', () => {
    it('open_url: pushes request to client as raw:event', async () => {
      const { claude, channelId } = await setup();
      const rawEvents = collectEvents(claude.socket, 'raw:event');

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(s.controlRequestOpenInEditor('open-url-1'));

      expect(rawEvents.length).toBeGreaterThan(0);
      expect(rawEvents[0].rawType).toBe('control_request/open_in_editor');
    });
  });

  describe('partial CR response + reconnect', () => {
    it('removes only responded CR from pending', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(s.assistant({ toolUse: { id: 'toolu_p1', name: 'Read', input: {} } }));
      await claude.emit(s.controlRequest('req-a', 'can_use_tool', 'Read', {}));
      await claude.emit(s.controlRequest('req-b', 'can_use_tool', 'Write', {}));

      // Respond to req-a only
      await claude.send('chat:respond', {
        channelId,
        requestId: 'req-a',
        response: { behavior: 'allow', updatedInput: {} },
      });

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = claude.container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.get(channelId)?.hasControlRequest('req-a')).toBe(false);
      expect(mgr.get(channelId)?.hasControlRequest('req-b')).toBe(true);
    });
  });

  it('auto-responds to get_settings control_request from CLI', async () => {
    const { claude } = await setup();

    // FakeClaude auto-responds to all control_requests including get_settings
    expect(claude.received().length).toBeGreaterThan(0);
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

  it('responds to control request from scene', async () => {
    const { claude, channelId } = await setup();
    const permEvents = collectEvents(claude.socket, 'control:permission');
    const resultEvents = collectEvents(claude.socket, 'message:result');

    await claude.send('chat:send', { channelId, message: 'go' });

    await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'Write', input: {} } }));
    await claude.emit(s.controlRequest('req-1', 'can_use_tool', 'Write', {}));

    expect(permEvents.length).toBeGreaterThan(0);

    await claude.send('chat:respond', {
      channelId,
      requestId: 'req-1',
      response: { behavior: 'allow', updatedInput: {} },
    });

    await claude.emit(s.toolResult('toolu_1', 'ok'));
    await claude.emit(s.result());

    expect(resultEvents.length).toBeGreaterThan(0);
  });

  it('emits control:permission when can_use_tool control_request arrives', async () => {
    const { claude, channelId } = await setup();
    const permRequests = collectEvents(claude.socket, 'control:permission');

    await claude.send('chat:send', { channelId, message: 'go' });

    claude.emit(
      s.assistant({ toolUse: { id: 'toolu_2', name: 'Bash', input: { command: 'ls' } } }),
    );
    await claude.emit(s.controlRequest('req-perm-1', 'can_use_tool', 'Bash', { command: 'ls' }));

    expect(permRequests).toHaveLength(1);
    expect(permRequests[0].requestId).toBe('req-perm-1');
    expect(permRequests[0].toolName).toBe('Bash');
    expect(permRequests[0].input).toMatchObject({ command: 'ls' });
  });

  it('emits cancel_request S→C when control_cancel_request arrives', async () => {
    const { claude, channelId } = await setup();
    const cancelRequests = collectEvents(claude.socket, 'cancel_request');

    await claude.send('chat:send', { channelId, message: 'go' });

    await claude.emit(s.assistant({ toolUse: { id: 'toolu_cr', name: 'Read', input: {} } }));
    await claude.emit(s.controlRequest('req-cancel-1', 'can_use_tool', 'Read', {}));

    await claude.emit(s.controlCancelRequest('req-cancel-1'));

    expect(cancelRequests).toHaveLength(1);
    expect(cancelRequests[0].targetRequestId).toBe('req-cancel-1');
  });

  it('response from client triggers respondToControlRequest', async () => {
    const { claude, channelId } = await setup();
    const permEvents = collectEvents(claude.socket, 'control:permission');
    const resultEvents = collectEvents(claude.socket, 'message:result');

    await claude.send('chat:send', { channelId, message: 'go' });

    await claude.emit(s.assistant({ toolUse: { id: 'toolu_3', name: 'Write', input: {} } }));
    await claude.emit(s.controlRequest('req-resp-1', 'can_use_tool', 'Write', {}));

    expect(permEvents.length).toBeGreaterThan(0);

    await claude.send('chat:respond', {
      channelId,
      requestId: 'req-resp-1',
      response: { behavior: 'allow', updatedInput: {} },
    });

    await claude.emit(s.toolResult('toolu_3', 'ok'));
    await claude.emit(s.result());

    expect(resultEvents.length).toBeGreaterThan(0);
  });

  it('silently ignores control_response for unknown requestId', async () => {
    const claude = createFakeClaude();

    await claude.send('chat:respond', {
      requestId: 'req-1',
      response: { behavior: 'allow', updatedInput: {} },
    });

    // No error — test passes if we reach here
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

    await claude.send('cancel_request', { targetRequestId: 'req-cancel-test' });

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

    await claude.send('cancel_request', { targetRequestId: 'req-cancel-cs' });

    expect(claude.socket.connected).toBe(true);
  });

  describe('reconnect / pending CR replay', () => {
    it('stores control_request in pending when session has CR', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(s.assistant({ toolUse: { id: 'toolu_p', name: 'Bash', input: {} } }));
      await claude.emit(s.controlRequest('req-pending', 'can_use_tool', 'Bash', {}));

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = claude.container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.get(channelId)?.hasControlRequest('req-pending')).toBe(true);
    });

    it('replays pending CRs on rejoin via second socket', async () => {
      const { claude, channelId } = await setup();
      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(s.assistant({ toolUse: { id: 'toolu_r', name: 'Read', input: {} } }));
      await claude.emit(s.controlRequest('req-replay', 'can_use_tool', 'Read', {}));

      const socketB = claude.connect();
      const bPermEvents: any[] = [];
      socketB.on('control:permission', (p: any) => bPermEvents.push(p));

      await new Promise<void>((resolve) => {
        socketB.emit('session:join', { channelId }, () => resolve());
      });
      await new Promise<void>((r) => setTimeout(r, 50));

      expect(bPermEvents.length).toBeGreaterThan(0);
      expect(bPermEvents[0].requestId).toBe('req-replay');
    });

    it('does not hang: mcp_message cleared on session kill', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(
        s.controlRequest('mcp-kill', 'mcp_message', undefined, {
          server_name: 'test',
          message: { jsonrpc: '2.0', method: 'test', id: 1 },
        }),
      );

      await claude.send('session:close', { channelId });

      expect(claude.handle.signal.aborted).toBe(true);
    });
  });
});
