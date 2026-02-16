import type { ChatStreamEvent } from '@code-quest/shared';
import type { StreamParser } from '../types.ts';

export class ClaudeStreamParser implements StreamParser {
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
      case 'system':
        if (json.subtype === 'init' && typeof json.session_id === 'string') {
          this.cliSessionId = json.session_id;
          return [{ type: 'init', data: { sessionId: json.session_id } }];
        }
        return [];

      case 'assistant':
        return this.parseAssistantMessage(json);

      case 'user':
        // User events contain auto-executed tool results from CLI.
        // We silently ignore them — the tool_result is already tracked
        // via the assistant's tool_use event.
        return [];

      case 'result':
        return this.parseResult(json);

      case 'permission':
        return [
          {
            type: 'permission_request',
            data: {
              toolName: (json.tool_name ?? json.tool ?? '') as string,
              description: (json.description ?? json.message ?? '') as string,
            },
          },
        ];

      default:
        return [];
    }
  }

  private parseAssistantMessage(json: Record<string, unknown>): ChatStreamEvent[] {
    const message = json.message as Record<string, unknown> | undefined;
    if (!message) return [];

    const content = message.content as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(content)) return [];

    const events: ChatStreamEvent[] = [];
    for (const block of content) {
      switch (block.type) {
        case 'text':
          events.push({ type: 'text', data: { content: block.text as string } });
          break;
        case 'thinking':
          events.push({ type: 'thinking', data: { content: block.thinking as string } });
          break;
        case 'tool_use':
          events.push({
            type: 'tool_use',
            data: { id: block.id as string, name: block.name as string, input: block.input },
          });
          break;
        case 'tool_result':
          events.push({
            type: 'tool_result',
            data: {
              name: (block.tool_use_id ?? block.name) as string,
              output: (block.content ?? block.output) as string,
            },
          });
          break;
      }
    }

    return events;
  }

  private parseResult(json: Record<string, unknown>): ChatStreamEvent[] {
    // Real Claude CLI puts token counts inside `usage` object, not at top level
    const usage = json.usage as Record<string, unknown> | undefined;
    return [
      {
        type: 'result',
        data: {
          stats: {
            costUsd: json.total_cost_usd as number | undefined,
            durationMs: json.duration_ms as number | undefined,
            inputTokens: (usage?.input_tokens ?? json.input_tokens) as number | undefined,
            outputTokens: (usage?.output_tokens ?? json.output_tokens) as number | undefined,
          },
        },
      },
    ];
  }
}
