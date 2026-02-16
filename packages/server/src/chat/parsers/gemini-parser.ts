import type { ChatStreamEvent } from '@code-quest/shared';
import type { StreamParser } from '../types.ts';

/**
 * Parser for Gemini CLI stream-json output (gemini -o stream-json)
 *
 * Real Gemini CLI format:
 * - init:        {"type":"init","session_id":"...","model":"...","timestamp":"..."}
 * - user msg:    {"type":"message","role":"user","content":"...","timestamp":"..."}
 * - assistant:   {"type":"message","role":"assistant","content":"...","delta":true,"timestamp":"..."}
 * - tool_use:    {"type":"tool_use","tool_name":"...","tool_id":"...","parameters":{...},"timestamp":"..."}
 * - tool_result: {"type":"tool_result","tool_id":"...","status":"...","output":"...","timestamp":"..."}
 * - result:      {"type":"result","status":"success","stats":{...},"timestamp":"..."}
 */
export class GeminiStreamParser implements StreamParser {
  private cliSessionId: string | null = null;

  parseLine(line: string): ChatStreamEvent[] {
    const trimmed = line.trim();
    if (!trimmed) return [];

    try {
      const json = JSON.parse(trimmed);
      return this.parseJson(json);
    } catch {
      return [{ type: 'error', data: { message: `Failed to parse JSON: ${trimmed}` } }];
    }
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

      case 'tool_use':
        return [
          {
            type: 'tool_use',
            data: {
              id: json.tool_id as string,
              name: json.tool_name as string,
              input: json.parameters as unknown,
            },
          },
        ];

      case 'tool_result':
        return [
          {
            type: 'tool_result',
            data: {
              name: json.tool_id as string,
              output: (json.output ?? '') as string,
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
            durationMs: stats?.duration_ms as number | undefined,
            inputTokens: stats?.input_tokens as number | undefined,
            outputTokens: stats?.output_tokens as number | undefined,
          },
        },
      },
    ];
  }
}
