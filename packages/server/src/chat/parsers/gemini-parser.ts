import type { ChatStreamEvent, StreamParser } from '../types';

/**
 * Parser for Gemini CLI stream-json output (gemini -o stream-json)
 *
 * Gemini format differs from Claude:
 * - init:    {"type":"init","session_id":"...","model":"..."}
 * - user:    {"type":"message","role":"user","content":"..."}
 * - text:    {"type":"message","role":"assistant","content":"...","delta":true}
 * - action:  {"type":"action","tool_name":"...","tool_input":{...}}
 * - result:  {"type":"action_result","tool_name":"...","output":"..."}
 * - done:    {"type":"result","status":"success","stats":{"input_tokens":...,"output_tokens":...,"duration_ms":...}}
 */
export class GeminiStreamParser implements StreamParser {
  private buffer = '';
  private cliSessionId: string | null = null;

  feed(chunk: string): ChatStreamEvent[] {
    this.buffer += chunk;
    const events: ChatStreamEvent[] = [];
    const lines = this.buffer.split('\n');

    this.buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const json = JSON.parse(trimmed);
        events.push(...this.parseJson(json));
      } catch {
        events.push({ type: 'error', data: { message: `Failed to parse JSON: ${trimmed}` } });
      }
    }

    return events;
  }

  getCliSessionId(): string | null {
    return this.cliSessionId;
  }

  private parseJson(json: Record<string, unknown>): ChatStreamEvent[] {
    switch (json.type) {
      case 'init':
        if (typeof json.session_id === 'string') {
          this.cliSessionId = json.session_id;
          return [{ type: 'init', data: { sessionId: json.session_id } }];
        }
        return [];

      case 'message':
        return this.parseMessage(json);

      case 'action':
        return [
          {
            type: 'tool_use',
            data: {
              name: json.tool_name as string,
              input: json.tool_input as unknown,
            },
          },
        ];

      case 'action_result':
        return [
          {
            type: 'tool_result',
            data: {
              name: json.tool_name as string,
              output: json.output as string,
            },
          },
        ];

      case 'result':
        return this.parseResult(json);

      default:
        return [];
    }
  }

  private parseMessage(json: Record<string, unknown>): ChatStreamEvent[] {
    // Only process assistant messages, ignore user messages
    if (json.role !== 'assistant') return [];

    const content = json.content as string | undefined;
    if (typeof content !== 'string') return [];

    return [{ type: 'text', data: { content } }];
  }

  private parseResult(json: Record<string, unknown>): ChatStreamEvent[] {
    const stats = json.stats as Record<string, unknown> | undefined;
    return [
      {
        type: 'result',
        data: {
          stats: {
            costUsd: (json.total_cost_usd ?? stats?.total_cost_usd) as number | undefined,
            durationMs: (json.duration_ms ?? stats?.duration_ms) as number | undefined,
            inputTokens: (json.input_tokens ?? stats?.input_tokens) as number | undefined,
            outputTokens: (json.output_tokens ?? stats?.output_tokens) as number | undefined,
          },
        },
      },
    ];
  }
}
