import type { SocketEvent } from '../../types.ts';

export function transformResultEvent(event: Record<string, unknown>): SocketEvent | SocketEvent[] {
  const usage = event.usage as Record<string, unknown> | undefined;
  const resultPayload = {
    stats: {
      totalCostUsd: event.total_cost_usd,
      durationMs: event.duration_ms,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
      cacheReadInputTokens: usage?.cache_read_input_tokens,
      cacheCreationInputTokens: usage?.cache_creation_input_tokens,
      numTurns: event.num_turns,
      modelUsage: event.modelUsage,
    },
    errors: event.errors,
    isError: event.is_error,
    subtype: event.subtype,
  };

  const resultEvent: SocketEvent = { name: 'message:result', payload: resultPayload };

  if (event.is_error && Array.isArray(event.errors) && (event.errors as unknown[]).length > 0) {
    return [
      resultEvent,
      { name: 'error:message', payload: { message: (event.errors as string[]).join('; ') } },
    ];
  }

  return resultEvent;
}
