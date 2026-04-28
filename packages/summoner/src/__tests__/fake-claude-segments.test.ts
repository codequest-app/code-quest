import { beforeEach, describe, expect, it } from 'vitest';
import { resetSeq, segments } from '../test/segments.ts';

/** Parse a segment string into an object for assertions */
const parse = (s: string) => JSON.parse(s) as Record<string, unknown>;

describe('segments', () => {
  describe('returns JSON strings', () => {
    it('init returns a string', () => {
      expect(typeof segments.init('s1')).toBe('string');
    });

    it('assistant returns a string', () => {
      expect(typeof segments.assistant('hi')).toBe('string');
    });

    it('result returns a string', () => {
      expect(typeof segments.result()).toBe('string');
    });
  });

  describe('_seq reset (#1)', () => {
    beforeEach(() => {
      resetSeq();
    });

    it('produces deterministic UUIDs after reset', () => {
      const a = parse(segments.init('s1'));
      expect(a.uuid).toBe('fake-init-1');
      const b = parse(segments.assistant('hi'));
      expect(b.uuid).toBe('fake-asst-2');
    });

    it('reset brings counter back to 0', () => {
      segments.init('s1');
      segments.init('s2');
      resetSeq();
      const c = parse(segments.init('s3'));
      expect(c.uuid).toBe('fake-init-1');
    });
  });

  describe('thinking (#26)', () => {
    beforeEach(() => {
      resetSeq();
    });

    it('produces assistant with thinking content block', () => {
      const line = parse(segments.thinking('analyzing the problem'));
      expect(line.type).toBe('assistant');
      const content = (line.message as Record<string, unknown[]>).content![0] as Record<
        string,
        unknown
      >;
      expect(content.type).toBe('thinking');
      expect(content.thinking).toBe('analyzing the problem');
    });

    it('increments seq for uuid', () => {
      const a = parse(segments.thinking('a'));
      const b = parse(segments.thinking('b'));
      expect(a.uuid).toBe('fake-asst-1');
      expect(b.uuid).toBe('fake-asst-2');
    });
  });

  describe('controlCancelRequest (#27)', () => {
    it('produces control_cancel_request', () => {
      const line = parse(segments.controlCancelRequest('req-42'));
      expect(line.type).toBe('control_cancel_request');
      expect(line.request_id).toBe('req-42');
    });
  });

  describe('parentToolUseId (#31)', () => {
    it('assistant text defaults parent_tool_use_id to null', () => {
      const line = parse(segments.assistant('hello'));
      expect(line.parent_tool_use_id).toBeNull();
    });

    it('assistant text accepts parentToolUseId option', () => {
      const line = parse(segments.assistant('hello', { parentToolUseId: 'toolu_parent' }));
      expect(line.parent_tool_use_id).toBe('toolu_parent');
    });

    it('assistant toolUse accepts parentToolUseId option', () => {
      const line = parse(
        segments.assistant(
          { toolUse: { id: 'toolu_1', name: 'Read', input: {} } },
          { parentToolUseId: 'toolu_parent' },
        ),
      );
      expect(line.parent_tool_use_id).toBe('toolu_parent');
    });

    it('toolResult accepts parentToolUseId option', () => {
      const line = parse(
        segments.toolResult('toolu_1', 'content', { parentToolUseId: 'toolu_parent' }),
      );
      expect(line.parent_tool_use_id).toBe('toolu_parent');
    });

    it('toolResult defaults parent_tool_use_id to null', () => {
      const line = parse(segments.toolResult('toolu_1', 'content'));
      expect(line.parent_tool_use_id).toBeNull();
    });

    it('thinking accepts parentToolUseId option', () => {
      const line = parse(segments.thinking('deep thought', { parentToolUseId: 'toolu_parent' }));
      expect(line.parent_tool_use_id).toBe('toolu_parent');
    });
  });

  describe('status (#30)', () => {
    it('produces system/status with status text', () => {
      const line = parse(segments.status({ status: 'Reading file...' }));
      expect(line.type).toBe('system');
      expect(line.subtype).toBe('status');
      expect(line.status).toBe('Reading file...');
    });

    it('produces system/status with permissionMode', () => {
      const line = parse(segments.status({ permissionMode: 'plan' }));
      expect(line.permissionMode).toBe('plan');
      expect(line.status).toBeNull();
    });
  });

  describe('taskStarted (#29)', () => {
    it('produces system/task_started', () => {
      const line = parse(segments.taskStarted('toolu_abc', 'Explore codebase'));
      expect(line.type).toBe('system');
      expect(line.subtype).toBe('task_started');
      expect(line.tool_use_id).toBe('toolu_abc');
      expect(line.description).toBe('Explore codebase');
    });
  });

  describe('resultError (#28)', () => {
    beforeEach(() => {
      resetSeq();
    });

    it('produces result with error_during_execution subtype', () => {
      const line = parse(segments.resultError());
      expect(line.type).toBe('result');
      expect(line.subtype).toBe('error_during_execution');
      expect(line.is_error).toBe(false);
    });

    it('accepts optional durationMs', () => {
      const line = parse(segments.resultError({ durationMs: 5000 }));
      expect(line.duration_ms).toBe(5000);
    });
  });

  describe('controlResponse', () => {
    it('produces control_response type', () => {
      const line = parse(segments.controlResponse('req-1'));
      expect(line.type).toBe('control_response');
    });

    it('controlResponseError produces control_response type', () => {
      const line = parse(segments.controlResponseError('req-1', 'some error'));
      expect(line.type).toBe('control_response');
    });
  });
});
