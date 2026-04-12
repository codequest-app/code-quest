/* biome-ignore-all lint/suspicious/noExplicitAny: test file */
import { segments as s } from '@code-quest/summoner/test';
import { describe, expect, it } from 'vitest';
import { createFakeSummoner } from '../test/index.ts';

async function setup() {
  const claude = createFakeSummoner().claude();
  const channelId = await claude.initialize(s.init('wire-test-session'));
  return { claude, channelId };
}

describe('Channel.bindRunner', () => {
  describe('socket event handling (pipeline)', () => {
    it('broadcasts assistant message via message:assistant named event', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(s.assistant('Hello!'));
      await claude.emit(s.result());

      const events = claude.events('message:assistant');
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].channelId).toBe(channelId);
      expect(events[0].content[0]).toMatchObject({ type: 'text', text: 'Hello!' });
    });

    it('broadcasts permission_request via control:permission named event', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'Read', input: {} } }));
      await claude.emit(s.controlRequest('req-1', 'can_use_tool', 'Read', {}));

      const events = claude.events('control:permission');
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].channelId).toBe(channelId);
      expect(events[0].toolName).toBe('Read');
    });

    it('updates permissionMode from session:status event', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(s.status({ permissionMode: 'plan' }));

      const events = claude.events('session:status');
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].permissionMode).toBe('plan');
    });

    it('invokes onClientMessage hook after broadcasting', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(s.assistant('test'));
      await claude.emit(s.result());

      const events = claude.events('message:assistant');
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('control_response handling', () => {
    it('control_response from client reaches Claude stdin', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'Read', input: {} } }));
      await claude.emit(s.controlRequest('req-1', 'can_use_tool', 'Read', {}));

      await claude.send('chat:respond', {
        channelId,
        requestId: 'req-1',
        response: { behavior: 'allow', updatedInput: {} },
      });

      expect(claude.received('control_response').length).toBeGreaterThan(0);
    });
  });

  describe('control_request handling', () => {
    it('control_request tracked — chat:respond can resolve it', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'Read', input: {} } }));
      await claude.emit(s.controlRequest('req-1', 'can_use_tool', 'Read', {}));

      await claude.send('chat:respond', {
        channelId,
        requestId: 'req-1',
        response: { behavior: 'allow', updatedInput: {} },
      });

      expect(claude.received('control_response').length).toBeGreaterThan(0);
    });
  });

  describe('exit handling', () => {
    it('process exit emits session:closed', async () => {
      const { claude, channelId } = await setup();

      claude.handle.abort();
      await new Promise<void>((r) => queueMicrotask(r));

      const closedEvents = claude.events('session:closed');
      expect(closedEvents.length).toBeGreaterThan(0);
      expect(closedEvents[0].channelId).toBe(channelId);
    });

    it('exited channel is marked as exited', async () => {
      const { claude } = await setup();

      claude.handle.abort();
      await new Promise<void>((r) => queueMicrotask(r));

      expect(claude.handle.signal.aborted).toBe(true);
    });

    it('destroy cleans up channel', async () => {
      const { claude, channelId } = await setup();

      await claude.send('session:close', { channelId });

      expect(claude.handle.signal.aborted).toBe(true);
    });
  });

  describe('lifecycle', () => {
    it('second launch creates separate channel', async () => {
      const claude = createFakeSummoner().claude();
      const ch1 = await claude.initialize({ launch: { channelId: 'ch-1' } });
      const ch2 = await claude.initialize({ launch: { channelId: 'ch-2' } });

      expect(ch1).toBe('ch-1');
      expect(ch2).toBe('ch-2');
    });

    it('unbindRunner on destroy', async () => {
      const { claude, channelId } = await setup();
      await claude.send('session:close', { channelId });
      expect(claude.handle.signal.aborted).toBe(true);
    });

    it('destroy removes all listeners — no more events after destroy', async () => {
      const { claude, channelId } = await setup();

      const countBefore = claude.events('message:assistant').length;

      await claude.send('session:close', { channelId });

      try {
        await claude.emit(s.assistant('should not arrive'));
      } catch {
        /* aborted handle */
      }

      expect(claude.events('message:assistant').length).toBe(countBefore);
    });
  });
});
