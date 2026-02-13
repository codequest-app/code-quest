import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GeminiStreamParser } from '../parsers/gemini-parser.ts';

describe('GeminiStreamParser (fixture-driven)', () => {
  function loadFixture(name: string): string {
    return readFileSync(new URL(`../__fixtures__/gemini/${name}`, import.meta.url), 'utf-8');
  }

  function parseFixture(name: string) {
    const parser = new GeminiStreamParser();
    return { events: parser.feed(loadFixture(name)), parser };
  }

  it('should parse simple-text fixture', () => {
    const { events, parser } = parseFixture('simple-text.jsonl');

    expect(events).toContainEqual(expect.objectContaining({ type: 'init' }));
    expect(events).toContainEqual(expect.objectContaining({ type: 'text' }));
    expect(events).toContainEqual(expect.objectContaining({ type: 'result' }));

    const init = events.find((e) => e.type === 'init');
    expect(init).toBeDefined();
    expect(init?.data).toEqual({ sessionId: 'dff02b29-1234-5678-abcd-ef0123456789' });

    const text = events.find((e) => e.type === 'text');
    expect(text).toBeDefined();
    expect(text?.data).toEqual({ content: 'Hello! How can I help you today?' });

    // User messages should be ignored
    const userTexts = events.filter((e) => e.type === 'text');
    expect(userTexts).toHaveLength(1); // Only assistant text, not user

    const result = events.find((e) => e.type === 'result');
    expect(result).toBeDefined();
    const stats = (result?.data as { stats: Record<string, unknown> }).stats;
    expect(stats.durationMs).toBe(5878);
    expect(stats.inputTokens).toBe(17031);
    expect(stats.outputTokens).toBe(34);
    // Gemini has no cost field
    expect(stats.costUsd).toBeUndefined();

    expect(parser.getCliSessionId()).toBe('dff02b29-1234-5678-abcd-ef0123456789');
  });

  it('should parse tool-use-read fixture', () => {
    const { events } = parseFixture('tool-use-read.jsonl');

    const toolUse = events.find((e) => e.type === 'tool_use');
    expect(toolUse).toBeDefined();
    expect(toolUse?.data).toHaveProperty('id', 'read_file-abc123-533c7505fb7fc');
    expect(toolUse?.data).toHaveProperty('name', 'read_file');
    expect(toolUse?.data).toHaveProperty('input');
    expect((toolUse?.data as { input: Record<string, unknown> }).input).toEqual({
      file_path: 'package.json',
    });

    const toolResult = events.find((e) => e.type === 'tool_result');
    expect(toolResult).toBeDefined();
    expect(toolResult?.data).toHaveProperty('name', 'read_file-abc123-533c7505fb7fc');

    const result = events.find((e) => e.type === 'result');
    expect(result).toBeDefined();
    const stats = (result?.data as { stats: Record<string, unknown> }).stats;
    expect(stats.durationMs).toBe(4554);
  });
});
