import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GeminiStreamParser } from '../parsers/gemini-parser.ts';

describe('GeminiStreamParser (fixture-driven)', () => {
  function loadFixture(name: string): string {
    return readFileSync(new URL(`../__fixtures__/gemini/${name}`, import.meta.url), 'utf-8');
  }

  function parseFixture(name: string) {
    const parser = new GeminiStreamParser();
    const events = loadFixture(name)
      .split('\n')
      .flatMap((line) => parser.parseLine(line));
    return { events, parser };
  }

  it('should parse simple-text fixture', () => {
    const { events, parser } = parseFixture('simple-text.jsonl');

    expect(events).toContainEqual(expect.objectContaining({ type: 'init' }));
    expect(events).toContainEqual(expect.objectContaining({ type: 'text' }));
    expect(events).toContainEqual(expect.objectContaining({ type: 'result' }));

    const init = events.find((e) => e.type === 'init');
    expect(init?.data).toHaveProperty('sessionId');

    // User messages should be ignored
    const userTexts = events.filter((e) => e.type === 'text');
    expect(userTexts).toHaveLength(1);

    const result = events.find((e) => e.type === 'result');
    expect(result).toBeDefined();
    const stats = (result?.data as { stats: Record<string, unknown> }).stats;
    expect(stats.durationMs).toBeGreaterThan(0);
    expect(stats.inputTokens).toBeGreaterThan(0);
    expect(stats.outputTokens).toBeGreaterThan(0);
    expect(stats.costUsd).toBeUndefined();

    expect(parser.getCliSessionId()).toBeTruthy();
  });

  it('should parse tool-use-read fixture', () => {
    const { events } = parseFixture('tool-use-read.jsonl');

    const toolUse = events.find((e) => e.type === 'tool_use');
    expect(toolUse).toBeDefined();
    expect(toolUse?.data).toHaveProperty('id');
    expect(toolUse?.data).toHaveProperty('name', 'read_file');
    expect(toolUse?.data).toHaveProperty('input');
    expect((toolUse?.data as { input: Record<string, unknown> }).input).toHaveProperty('file_path');

    const toolResult = events.find((e) => e.type === 'tool_result');
    expect(toolResult).toBeDefined();

    const result = events.find((e) => e.type === 'result');
    expect(result).toBeDefined();
    const stats = (result?.data as { stats: Record<string, unknown> }).stats;
    expect(stats.durationMs).toBeGreaterThan(0);
  });
});
