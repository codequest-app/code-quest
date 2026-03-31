/* biome-ignore-all lint/suspicious/noExplicitAny: test file */
import type { ProcessRunner } from '@code-quest/summoner';
import { describe, expect, it, vi } from 'vitest';
import { Channel } from '../socket/channel.ts';

function fakeRunner(): ProcessRunner {
  return {
    write: vi.fn(),
    kill: vi.fn(),
    abort: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as ProcessRunner;
}

function fakeSocket() {
  return { emit: vi.fn(), id: crypto.randomUUID() } as any;
}

describe('Channel', () => {
  describe('state machine', () => {
    it('starts in launching state', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude');
      expect(channel.state).toBe('launching');
    });

    it('allows valid transitions: launching → active → streaming → active', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude');
      channel.transition('active');
      expect(channel.state).toBe('active');

      channel.transition('streaming');
      expect(channel.state).toBe('streaming');

      channel.transition('active');
      expect(channel.state).toBe('active');
    });

    it('allows streaming → cancelling → active', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude');
      channel.transition('active');
      channel.transition('streaming');
      channel.transition('cancelling');
      expect(channel.state).toBe('cancelling');

      channel.transition('active');
      expect(channel.state).toBe('active');
    });

    it('rejects invalid transitions', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude');
      expect(() => channel.transition('streaming')).toThrow(
        'Invalid Channel state transition: launching → streaming',
      );
      expect(channel.state).toBe('launching');
    });

    it('rejects transitions from closed', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude');
      channel.transition('closed');
      expect(() => channel.transition('active')).toThrow(
        'Invalid Channel state transition: closed → active',
      );
    });

    it('allows any state to transition to closed', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude');
      channel.transition('active');
      channel.transition('closed');
      expect(channel.state).toBe('closed');
    });
  });

  describe('socket management', () => {
    it('adds and removes sockets', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude');
      const sock = fakeSocket();
      channel.addSocket(sock);
      expect(channel.sockets.size).toBe(1);

      channel.removeSocket(sock);
      expect(channel.sockets.size).toBe(0);
    });

    it('broadcasts to all sockets', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude');
      const sock1 = fakeSocket();
      const sock2 = fakeSocket();
      channel.addSocket(sock1);
      channel.addSocket(sock2);

      channel.emit('error', { channelId: 'sess-1', event: { type: 'error', message: 'x' } });

      expect(sock1.emit).toHaveBeenCalledWith('error', {
        channelId: 'sess-1',
        event: { type: 'error', message: 'x' },
      });
      expect(sock2.emit).toHaveBeenCalledWith('error', {
        channelId: 'sess-1',
        event: { type: 'error', message: 'x' },
      });
    });
  });

  describe('buildSessionInitPayload', () => {
    it('returns session:init payload from metaCache + sessionState', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude');
      channel.sessionId = 'cli-sess-1';
      channel.updateMetaCache({
        model: 'claude-sonnet-4-6',
        tools: ['Read', 'Write'],
        permissionMode: 'default',
        fastModeState: 'off',
        mcpServers: [{ name: 'github', status: 'connected' }],
        slashCommands: ['commit', 'review'],
      });
      channel.updateSessionState({ cwd: '/home/user', effort: 'high' });

      const payload = channel.buildSessionInitPayload();

      expect(payload).toEqual({
        channelId: 'sess-1',
        sessionId: 'cli-sess-1',
        model: 'claude-sonnet-4-6',
        tools: ['Read', 'Write'],
        permissionMode: 'default',
        fastModeState: 'off',
        mcpServers: [{ name: 'github', status: 'connected' }],
        slashCommands: ['commit', 'review'],
        config: { cwd: '/home/user', effort: 'high' },
      });
    });

    it('omits undefined metaCache fields', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude');
      channel.sessionId = 'cli-sess-2';
      channel.updateMetaCache({ model: 'haiku' });

      const payload = channel.buildSessionInitPayload();

      expect(payload).toEqual({
        channelId: 'sess-1',
        sessionId: 'cli-sess-2',
        model: 'haiku',
        config: {},
      });
      expect(payload).not.toHaveProperty('tools');
      expect(payload).not.toHaveProperty('permissionMode');
    });
  });

  describe('nextSeq', () => {
    it('increments sequence', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude');
      expect(channel.nextSeq()).toBe(1);
      expect(channel.nextSeq()).toBe(2);
      expect(channel.nextSeq()).toBe(3);
    });
  });

  describe('controlRequestMeta', () => {
    it('trackControlRequest adds entry and hasControlRequest returns true', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude');
      channel.trackControlRequest('req-1', { subtype: 'can_use_tool', toolName: 'Read' });
      expect(channel.hasControlRequest('req-1')).toBe(true);
      expect(channel.getControlRequestMeta('req-1')).toEqual({
        subtype: 'can_use_tool',
        toolName: 'Read',
      });
    });

    it('removeControlRequest clears entry', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude');
      channel.trackControlRequest('req-1', { subtype: 'can_use_tool' });
      channel.removeControlRequest('req-1');
      expect(channel.hasControlRequest('req-1')).toBe(false);
      expect(channel.getControlRequestMeta('req-1')).toBeUndefined();
    });

    it('destroy clears all tracked control requests', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude');
      const sock = fakeSocket();
      channel.addSocket(sock);
      channel.trackControlRequest('req-1', { subtype: 'can_use_tool' });
      channel.trackControlRequest('req-2', { subtype: 'elicitation' });

      channel.destroy();

      expect(channel.hasControlRequest('req-1')).toBe(false);
      expect(channel.hasControlRequest('req-2')).toBe(false);
    });
  });

  describe('destroy', () => {
    it('cleans up all resources', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude');
      const sock = fakeSocket();
      channel.addSocket(sock);
      channel.trackControlRequest('req-1', { subtype: 'can_use_tool' });

      channel.destroy();

      expect(channel.state).toBe('closed');
      expect(channel.sockets.size).toBe(0);
      expect(channel.hasControlRequest('req-1')).toBe(false);
    });
  });

  describe('updateSessionState', () => {
    it('merges partial state', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude');
      channel.updateSessionState({ model: 'claude-sonnet-4-6' });
      channel.updateSessionState({ cwd: '/home' });
      expect(channel.sessionState).toEqual({ model: 'claude-sonnet-4-6', cwd: '/home' });
    });

    it('replaces existing keys', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude');
      channel.updateSessionState({ model: 'old' });
      channel.updateSessionState({ model: 'new' });
      expect(channel.sessionState).toEqual({ model: 'new' });
    });

    it('resets state when called with empty object after resetSessionState', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude');
      channel.updateSessionState({ model: 'x' });
      channel.resetSessionState();
      expect(channel.sessionState).toEqual({});
    });
  });

  describe('updateMetaCache', () => {
    it('merges partial cache', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude');
      channel.updateMetaCache({ model: 'claude-sonnet-4-6' });
      channel.updateMetaCache({ tools: ['Read'] });
      expect(channel.metaCache).toEqual({ model: 'claude-sonnet-4-6', tools: ['Read'] });
    });
  });
});
