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

describe('Channel', () => {
  // Socket management + broadcast tests removed.
  // Behavior now covered by ChannelEmitter (integration tests verify emit/emitToOthers).

  describe('controlRequestMeta', () => {
    it('trackControlRequest adds entry and hasControlRequest returns true', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude', '/test/cwd');
      channel.trackControlRequest('req-1', { subtype: 'can_use_tool', toolName: 'Read' });
      expect(channel.hasControlRequest('req-1')).toBe(true);
      expect(channel.getControlRequestMeta('req-1')).toEqual({
        subtype: 'can_use_tool',
        toolName: 'Read',
      });
    });

    it('removeControlRequest clears entry', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude', '/test/cwd');
      channel.trackControlRequest('req-1', { subtype: 'can_use_tool' });
      channel.removeControlRequest('req-1');
      expect(channel.hasControlRequest('req-1')).toBe(false);
      expect(channel.getControlRequestMeta('req-1')).toBeUndefined();
    });

    it('destroy clears all tracked control requests', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude', '/test/cwd');
      channel.trackControlRequest('req-1', { subtype: 'can_use_tool' });
      channel.trackControlRequest('req-2', { subtype: 'elicitation' });

      channel.destroy();

      expect(channel.hasControlRequest('req-1')).toBe(false);
      expect(channel.hasControlRequest('req-2')).toBe(false);
    });
  });

  describe('destroy', () => {
    it('cleans up all resources', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude', '/test/cwd');
      channel.trackControlRequest('req-1', { subtype: 'can_use_tool' });

      channel.destroy();

      expect(channel.exited).toBe(true);
      expect(channel.hasControlRequest('req-1')).toBe(false);
    });
  });

  describe('updateSessionConfig', () => {
    it('merges partial state', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude', '/test/cwd');
      channel.updateSessionConfig({ model: 'claude-sonnet-4-6' });
      channel.updateSessionConfig({ effort: 'high' });
      expect(channel.sessionConfig).toEqual({ model: 'claude-sonnet-4-6', effort: 'high' });
    });

    it('replaces existing keys', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude', '/test/cwd');
      channel.updateSessionConfig({ model: 'old' });
      channel.updateSessionConfig({ model: 'new' });
      expect(channel.sessionConfig).toEqual({ model: 'new' });
    });

    it('resets state when called with empty object after resetSessionConfig', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude', '/test/cwd');
      channel.updateSessionConfig({ model: 'x' });
      channel.resetSessionConfig();
      expect(channel.sessionConfig).toEqual({});
    });
  });

  describe('updateMetaCache', () => {
    it('merges partial cache', () => {
      const channel = new Channel(fakeRunner(), 'sess-1', 'claude', '/test/cwd');
      channel.updateMetaCache({ model: 'claude-sonnet-4-6' });
      channel.updateMetaCache({ tools: ['Read'] });
      expect(channel.metaCache).toEqual({ model: 'claude-sonnet-4-6', tools: ['Read'] });
    });
  });
});
