import type { ChatStreamEvent, StreamParser } from '../types';

export class ClaudeStreamParser implements StreamParser {
  private buffer = '';
  private cliSessionId: string | null = null;

  feed(chunk: string): ChatStreamEvent[] {
    this.buffer += chunk;
    const events: ChatStreamEvent[] = [];
    const lines = this.buffer.split('\n');

    // Keep the last incomplete line in buffer
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
      case 'system':
        if (json.subtype === 'init' && typeof json.session_id === 'string') {
          this.cliSessionId = json.session_id;
          return [{ type: 'init', data: { sessionId: json.session_id } }];
        }
        return [];

      case 'assistant':
        return this.parseAssistantMessage(json);

      case 'result':
        return [
          {
            type: 'result',
            data: {
              stats: {
                costUsd: json.total_cost_usd as number | undefined,
                durationMs: json.duration_ms as number | undefined,
                inputTokens: json.input_tokens as number | undefined,
                outputTokens: json.output_tokens as number | undefined,
              },
            },
          },
        ];

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
            data: { name: block.name as string, input: block.input },
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
}
