import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ClaudeParser } from '../claude-parser.ts';
import type { ChatStreamEvent } from '../types.ts';

const fixtureDir = join(import.meta.dirname, '../__fixtures__/claude');

function loadFixtureLines(filename: string): string[] {
  return readFileSync(join(fixtureDir, filename), 'utf-8')
    .split('\n')
    .filter((line) => line.trim());
}

describe('ClaudeParser', () => {
  describe('simple-text.jsonl', () => {
    it('should emit init, text, and result events', () => {
      const parser = new ClaudeParser();
      const lines = loadFixtureLines('simple-text.jsonl');
      const events: ChatStreamEvent[] = [];

      for (const line of lines) {
        events.push(...parser.parseLine(line));
      }

      expect(events[0]).toMatchObject({ type: 'init', sessionId: expect.any(String) });

      const textEvents = events.filter((e) => e.type === 'text');
      expect(textEvents.length).toBeGreaterThan(0);
      expect(textEvents[0]).toMatchObject({ type: 'text', content: expect.any(String) });

      const resultEvents = events.filter((e) => e.type === 'result');
      expect(resultEvents).toHaveLength(1);
      expect(resultEvents[0]).toMatchObject({
        type: 'result',
        stats: expect.objectContaining({ costUsd: expect.any(Number) }),
      });
    });
  });

  describe('tool-use-read.jsonl', () => {
    it('should emit tool_use and tool_result events with correct names', () => {
      const parser = new ClaudeParser();
      const lines = loadFixtureLines('tool-use-read.jsonl');
      const events: ChatStreamEvent[] = [];

      for (const line of lines) {
        events.push(...parser.parseLine(line));
      }

      const toolUse = events.find((e) => e.type === 'tool_use');
      expect(toolUse).toBeDefined();
      expect(toolUse).toMatchObject({
        type: 'tool_use',
        id: expect.any(String),
        name: 'Read',
        input: expect.anything(),
      });

      const toolResult = events.find((e) => e.type === 'tool_result');
      expect(toolResult).toBeDefined();
      expect(toolResult).toMatchObject({
        type: 'tool_result',
        name: 'Read', // Should resolve name from map, not show raw ID
      });
    });
  });

  describe('control-initialize.jsonl', () => {
    it('should emit control_response for initialize', () => {
      const parser = new ClaudeParser();
      const lines = loadFixtureLines('control-initialize.jsonl');
      const events: ChatStreamEvent[] = [];

      for (const line of lines) {
        events.push(...parser.parseLine(line));
      }

      const controlResponse = events.find((e) => e.type === 'control_response');
      expect(controlResponse).toBeDefined();
      expect(controlResponse).toMatchObject({
        type: 'control_response',
        requestId: expect.any(String),
        success: true,
      });
    });
  });

  describe('control-request-can-use-tool.jsonl', () => {
    it('should emit control_request', () => {
      const parser = new ClaudeParser();
      const lines = loadFixtureLines('control-request-can-use-tool.jsonl');
      const events: ChatStreamEvent[] = [];

      for (const line of lines) {
        events.push(...parser.parseLine(line));
      }

      const controlReq = events.find((e) => e.type === 'control_request');
      expect(controlReq).toBeDefined();
      expect(controlReq).toMatchObject({
        type: 'control_request',
        requestId: expect.any(String),
        subtype: 'can_use_tool',
        toolName: 'Write',
      });
    });
  });

  describe('ignored events', () => {
    it('should ignore rate_limit_event lines', () => {
      const parser = new ClaudeParser();
      const events = parser.parseLine(
        '{"type":"rate_limit_event","rate_limit_info":{"status":"allowed"}}',
      );
      expect(events).toHaveLength(0);
    });

    it('should ignore keep_alive', () => {
      const parser = new ClaudeParser();
      expect(parser.parseLine('{"type":"keep_alive"}')).toHaveLength(0);
    });

    it('should return empty for user echo-back without tool_result', () => {
      const parser = new ClaudeParser();
      expect(
        parser.parseLine('{"type":"user","message":{"role":"user","content":[]}}'),
      ).toHaveLength(0);
    });

    it('should ignore system hook_started', () => {
      const parser = new ClaudeParser();
      expect(
        parser.parseLine(
          '{"type":"system","subtype":"hook_started","hook_id":"a","hook_name":"b","hook_event":"c"}',
        ),
      ).toHaveLength(0);
    });

    it('should ignore system hook_response', () => {
      const parser = new ClaudeParser();
      expect(
        parser.parseLine(
          '{"type":"system","subtype":"hook_response","hook_id":"a","hook_name":"b","hook_event":"c"}',
        ),
      ).toHaveLength(0);
    });
  });

  describe('system/status', () => {
    it('emits status event from system/status message', () => {
      const parser = new ClaudeParser();
      const events = parser.parseLine(
        JSON.stringify({
          type: 'system',
          subtype: 'status',
          status: 'Thinking…',
        }),
      );

      expect(events).toEqual([{ type: 'status', message: 'Thinking…' }]);
    });
  });

  describe('edge cases', () => {
    it('should return empty array for malformed JSON', () => {
      const parser = new ClaudeParser();
      expect(parser.parseLine('not json')).toHaveLength(0);
    });

    it('should return empty array for empty lines', () => {
      const parser = new ClaudeParser();
      expect(parser.parseLine('')).toHaveLength(0);
      expect(parser.parseLine('  ')).toHaveLength(0);
    });

    it('should return empty array for unknown types', () => {
      const parser = new ClaudeParser();
      expect(parser.parseLine('{"type":"unknown_thing"}')).toHaveLength(0);
    });
  });

  describe('multiple content blocks', () => {
    it('should emit multiple events for assistant with mixed content', () => {
      const parser = new ClaudeParser();
      const line = JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            { type: 'text', text: 'Hello' },
            { type: 'thinking', thinking: 'Let me think' },
            { type: 'tool_use', id: 'toolu_1', name: 'Read', input: { file_path: '/tmp' } },
          ],
        },
      });
      const events = parser.parseLine(line);

      expect(events).toHaveLength(3);
      expect(events[0]).toMatchObject({ type: 'text', content: 'Hello' });
      expect(events[1]).toMatchObject({ type: 'thinking', content: 'Let me think' });
      expect(events[2]).toMatchObject({ type: 'tool_use', id: 'toolu_1', name: 'Read' });
    });
  });
});
