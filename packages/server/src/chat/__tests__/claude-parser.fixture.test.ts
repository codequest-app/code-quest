import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ClaudeStreamParser } from '../parsers/claude-parser.ts';

describe('ClaudeStreamParser (fixture-driven)', () => {
  function loadFixture(name: string): string {
    return readFileSync(new URL(`../__fixtures__/claude/${name}`, import.meta.url), 'utf-8');
  }

  function parseFixture(name: string) {
    const parser = new ClaudeStreamParser();
    return parser.feed(loadFixture(name));
  }

  it('should parse simple-text fixture', () => {
    const events = parseFixture('simple-text.jsonl');

    expect(events).toContainEqual(expect.objectContaining({ type: 'init' }));
    expect(events).toContainEqual(expect.objectContaining({ type: 'text' }));
    expect(events).toContainEqual(expect.objectContaining({ type: 'result' }));

    const init = events.find((e) => e.type === 'init')!;
    expect(init.data).toEqual({ sessionId: 'ce0ca308-1a2b-3c4d-5e6f-7890abcdef01' });

    const text = events.find((e) => e.type === 'text')!;
    expect(text.data).toEqual({ content: 'Hello! How can I help you today?' });

    const result = events.find((e) => e.type === 'result')!;
    const stats = (result.data as { stats: Record<string, unknown> }).stats;
    expect(stats.costUsd).toBe(0.005);
    expect(stats.durationMs).toBe(3751);
    // Token counts from usage object in real format
    expect(stats.inputTokens).toBe(150);
    expect(stats.outputTokens).toBe(12);
  });

  it('should parse tool-use-read fixture', () => {
    const events = parseFixture('tool-use-read.jsonl');

    const toolUse = events.find((e) => e.type === 'tool_use');
    expect(toolUse).toBeDefined();
    expect(toolUse?.data).toHaveProperty('id', 'toolu_01S4W5K8R2N3X7Y9Z');
    expect(toolUse?.data).toHaveProperty('name', 'Read');
    expect(toolUse?.data).toHaveProperty('input');

    // Should NOT produce events from "user" type lines (tool_result auto-exec)
    const userEvents = events.filter(
      (e) => e.type !== 'init' && e.type !== 'text' && e.type !== 'tool_use' && e.type !== 'result',
    );
    expect(userEvents).toHaveLength(0);

    const result = events.find((e) => e.type === 'result')!;
    const stats = (result.data as { stats: Record<string, unknown> }).stats;
    expect(stats.inputTokens).toBe(700);
    expect(stats.outputTokens).toBe(80);
  });

  it('should parse ask-user-question fixture', () => {
    const events = parseFixture('ask-user-question.jsonl');

    const thinking = events.find((e) => e.type === 'thinking');
    expect(thinking).toBeDefined();

    const toolUse = events.find((e) => e.type === 'tool_use');
    expect(toolUse).toBeDefined();
    expect(toolUse?.data).toHaveProperty('name', 'AskUserQuestion');
    expect(toolUse?.data).toHaveProperty('id', 'toolu_01ASK_Q1');

    const input = (toolUse?.data as { input: Record<string, unknown> }).input;
    expect(input).toHaveProperty('questions');
  });

  it('should extract cliSessionId from fixture', () => {
    const parser = new ClaudeStreamParser();
    parser.feed(loadFixture('simple-text.jsonl'));
    expect(parser.getCliSessionId()).toBe('ce0ca308-1a2b-3c4d-5e6f-7890abcdef01');
  });
});
