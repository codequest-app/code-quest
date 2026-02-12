import { describe, it, expect } from 'vitest';
import { ClaudeStreamParser } from '../parsers/claude-parser';
import { GeminiStreamParser } from '../parsers/gemini-parser';
import { createParser } from '../parsers';

describe('ClaudeStreamParser', () => {
  it('should parse init event and extract session_id', () => {
    const parser = new ClaudeStreamParser();
    const events = parser.feed('{"type":"system","subtype":"init","session_id":"abc-123"}\n');
    expect(events).toEqual([{ type: 'init', data: { sessionId: 'abc-123' } }]);
    expect(parser.getCliSessionId()).toBe('abc-123');
  });

  it('should parse assistant text', () => {
    const parser = new ClaudeStreamParser();
    const events = parser.feed(
      '{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"Hello world"}]}}\n'
    );
    expect(events).toEqual([{ type: 'text', data: { content: 'Hello world' } }]);
  });

  it('should parse assistant thinking content', () => {
    const parser = new ClaudeStreamParser();
    const events = parser.feed(
      '{"type":"assistant","message":{"role":"assistant","content":[{"type":"thinking","thinking":"Let me think..."}]}}\n'
    );
    expect(events).toEqual([{ type: 'thinking', data: { content: 'Let me think...' } }]);
  });

  it('should parse assistant tool_use content', () => {
    const parser = new ClaudeStreamParser();
    const events = parser.feed(
      '{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","name":"Read","input":{"file_path":"test.ts"}}]}}\n'
    );
    expect(events).toEqual([
      { type: 'tool_use', data: { name: 'Read', input: { file_path: 'test.ts' } } },
    ]);
  });

  it('should parse tool_result content', () => {
    const parser = new ClaudeStreamParser();
    const events = parser.feed(
      '{"type":"assistant","message":{"role":"tool","content":[{"type":"tool_result","tool_use_id":"123","content":"file contents"}]}}\n'
    );
    expect(events).toEqual([
      { type: 'tool_result', data: { name: '123', output: 'file contents' } },
    ]);
  });

  it('should parse result with stats', () => {
    const parser = new ClaudeStreamParser();
    const events = parser.feed(
      '{"type":"result","total_cost_usd":0.005,"duration_ms":1200,"input_tokens":100,"output_tokens":50}\n'
    );
    expect(events).toEqual([
      {
        type: 'result',
        data: {
          stats: {
            costUsd: 0.005,
            durationMs: 1200,
            inputTokens: 100,
            outputTokens: 50,
          },
        },
      },
    ]);
  });

  it('should buffer incomplete lines', () => {
    const parser = new ClaudeStreamParser();
    const events1 = parser.feed('{"type":"system","subtype":');
    expect(events1).toEqual([]);

    const events2 = parser.feed('"init","session_id":"abc-123"}\n');
    expect(events2).toEqual([{ type: 'init', data: { sessionId: 'abc-123' } }]);
  });

  it('should handle multiple lines in one chunk', () => {
    const parser = new ClaudeStreamParser();
    const events = parser.feed(
      '{"type":"system","subtype":"init","session_id":"abc-123"}\n' +
        '{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"Hi"}]}}\n'
    );
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('init');
    expect(events[1].type).toBe('text');
  });

  it('should emit error for malformed JSON lines', () => {
    const parser = new ClaudeStreamParser();
    const events = parser.feed('not valid json\n');
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('error');
  });

  it('should parse multiple content blocks from one assistant message', () => {
    const parser = new ClaudeStreamParser();
    const events = parser.feed(
      '{"type":"assistant","message":{"role":"assistant","content":[{"type":"thinking","thinking":"hmm"},{"type":"text","text":"answer"}]}}\n'
    );
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ type: 'thinking', data: { content: 'hmm' } });
    expect(events[1]).toEqual({ type: 'text', data: { content: 'answer' } });
  });
});

describe('GeminiStreamParser', () => {
  // Real Gemini CLI output format (gemini -o stream-json)
  it('should parse init event and extract session_id', () => {
    const parser = new GeminiStreamParser();
    const events = parser.feed(
      '{"type":"init","timestamp":"2026-02-11T19:00:06.801Z","session_id":"f9208bf4-1ab8-4568-b4d7-5328682922c5","model":"auto-gemini-2.5"}\n'
    );
    expect(events).toEqual([
      { type: 'init', data: { sessionId: 'f9208bf4-1ab8-4568-b4d7-5328682922c5' } },
    ]);
    expect(parser.getCliSessionId()).toBe('f9208bf4-1ab8-4568-b4d7-5328682922c5');
  });

  it('should parse assistant text message (delta)', () => {
    const parser = new GeminiStreamParser();
    const events = parser.feed(
      '{"type":"message","timestamp":"2026-02-11T19:00:12.664Z","role":"assistant","content":"hello world","delta":true}\n'
    );
    expect(events).toEqual([{ type: 'text', data: { content: 'hello world' } }]);
  });

  it('should parse user message and ignore it', () => {
    const parser = new GeminiStreamParser();
    const events = parser.feed(
      '{"type":"message","timestamp":"2026-02-11T19:00:06.802Z","role":"user","content":"Say hello"}\n'
    );
    expect(events).toEqual([]);
  });

  it('should parse tool_call action', () => {
    const parser = new GeminiStreamParser();
    const events = parser.feed(
      '{"type":"action","timestamp":"2026-02-11T19:00:08.000Z","tool_name":"shell","tool_input":{"command":"ls -la"}}\n'
    );
    expect(events).toEqual([
      { type: 'tool_use', data: { name: 'shell', input: { command: 'ls -la' } } },
    ]);
  });

  it('should parse action_result', () => {
    const parser = new GeminiStreamParser();
    const events = parser.feed(
      '{"type":"action_result","timestamp":"2026-02-11T19:00:09.000Z","tool_name":"shell","output":"file1.txt\\nfile2.txt"}\n'
    );
    expect(events).toEqual([
      { type: 'tool_result', data: { name: 'shell', output: 'file1.txt\nfile2.txt' } },
    ]);
  });

  it('should parse result with stats', () => {
    const parser = new GeminiStreamParser();
    const events = parser.feed(
      '{"type":"result","timestamp":"2026-02-11T19:00:12.679Z","status":"success","stats":{"total_tokens":17158,"input_tokens":17031,"output_tokens":34,"cached":0,"input":17031,"duration_ms":5878,"tool_calls":0}}\n'
    );
    expect(events).toEqual([
      {
        type: 'result',
        data: {
          stats: {
            costUsd: undefined,
            durationMs: 5878,
            inputTokens: 17031,
            outputTokens: 34,
          },
        },
      },
    ]);
  });

  it('should accumulate multiple delta messages', () => {
    const parser = new GeminiStreamParser();
    const e1 = parser.feed(
      '{"type":"message","role":"assistant","content":"Hello ","delta":true}\n'
    );
    const e2 = parser.feed(
      '{"type":"message","role":"assistant","content":"world!","delta":true}\n'
    );
    expect(e1).toEqual([{ type: 'text', data: { content: 'Hello ' } }]);
    expect(e2).toEqual([{ type: 'text', data: { content: 'world!' } }]);
  });

  it('should buffer incomplete lines', () => {
    const parser = new GeminiStreamParser();
    const events1 = parser.feed('{"type":"init"');
    expect(events1).toEqual([]);

    const events2 = parser.feed(',"session_id":"gem-456"}\n');
    expect(events2).toEqual([{ type: 'init', data: { sessionId: 'gem-456' } }]);
    expect(parser.getCliSessionId()).toBe('gem-456');
  });
});

describe('createParser', () => {
  it('should create a ClaudeStreamParser for "claude" provider', () => {
    const parser = createParser('claude');
    expect(parser).toBeInstanceOf(ClaudeStreamParser);
  });

  it('should create a GeminiStreamParser for "gemini" provider', () => {
    const parser = createParser('gemini');
    expect(parser).toBeInstanceOf(GeminiStreamParser);
  });
});
