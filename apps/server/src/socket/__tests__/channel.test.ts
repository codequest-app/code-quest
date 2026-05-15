import { ClaudeAdapter, ProcessRunner } from '@code-quest/summoner';
import { FakeProcessProvider } from '@code-quest/test-kit';
import { describe, expect, it } from 'vitest';
import { Channel } from '../channel.ts';

function makeRunner(): ProcessRunner {
  return new ProcessRunner({
    adapter: new ClaudeAdapter(),
    processProvider: new FakeProcessProvider(),
  });
}

function makeChannel() {
  return new Channel(makeRunner(), 'sess-1', 'claude', '/test/cwd');
}

describe('Channel', () => {
  describe('controlRequestMeta', () => {
    it('trackControlRequest adds entry and hasControlRequest returns true', () => {
      const channel = makeChannel();
      channel.trackControlRequest('req-1', { subtype: 'can_use_tool', toolName: 'Read' });
      expect(channel.hasControlRequest('req-1')).toBe(true);
      expect(channel.getControlRequestMeta('req-1')).toEqual({
        subtype: 'can_use_tool',
        toolName: 'Read',
      });
    });

    it('removeControlRequest clears entry', () => {
      const channel = makeChannel();
      channel.trackControlRequest('req-1', { subtype: 'can_use_tool' });
      channel.removeControlRequest('req-1');
      expect(channel.hasControlRequest('req-1')).toBe(false);
      expect(channel.getControlRequestMeta('req-1')).toBeUndefined();
    });

    it('destroy clears all tracked control requests', () => {
      const channel = makeChannel();
      channel.trackControlRequest('req-1', { subtype: 'can_use_tool' });
      channel.trackControlRequest('req-2', { subtype: 'elicitation' });

      channel.destroy();

      expect(channel.hasControlRequest('req-1')).toBe(false);
      expect(channel.hasControlRequest('req-2')).toBe(false);
    });
  });

  describe('destroy', () => {
    it('cleans up all resources', () => {
      const channel = makeChannel();
      channel.trackControlRequest('req-1', { subtype: 'can_use_tool' });

      channel.destroy();

      expect(channel.exited).toBe(true);
      expect(channel.hasControlRequest('req-1')).toBe(false);
    });
  });

  describe('updateSessionConfig', () => {
    it('merges partial state', () => {
      const channel = makeChannel();
      channel.updateSessionConfig({ model: 'claude-sonnet-4-6' });
      channel.updateSessionConfig({ effort: 'high' });
      expect(channel.sessionConfig).toEqual({ model: 'claude-sonnet-4-6', effort: 'high' });
    });

    it('replaces existing keys', () => {
      const channel = makeChannel();
      channel.updateSessionConfig({ model: 'old' });
      channel.updateSessionConfig({ model: 'new' });
      expect(channel.sessionConfig).toEqual({ model: 'new' });
    });

    it('resets state when called with empty object after resetSessionConfig', () => {
      const channel = makeChannel();
      channel.updateSessionConfig({ model: 'x' });
      channel.resetSessionConfig();
      expect(channel.sessionConfig).toEqual({});
    });
  });

  describe('updateMetaCache', () => {
    it('merges partial cache', () => {
      const channel = makeChannel();
      channel.updateMetaCache({ model: 'claude-sonnet-4-6' });
      channel.updateMetaCache({ tools: ['Read'] });
      expect(channel.metaCache).toEqual({ model: 'claude-sonnet-4-6', tools: ['Read'] });
    });
  });
});
