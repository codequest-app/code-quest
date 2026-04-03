import type { ClientMessage } from '../../types.ts';

export function transformResult(raw: Record<string, unknown>): ClientMessage | ClientMessage[] {
  const usage = raw.usage as Record<string, unknown> | undefined;
  const resultPayload = {
    stats: {
      totalCostUsd: raw.total_cost_usd,
      durationMs: raw.duration_ms,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
      cacheReadInputTokens: usage?.cache_read_input_tokens,
      cacheCreationInputTokens: usage?.cache_creation_input_tokens,
      numTurns: raw.num_turns,
      modelUsage: raw.modelUsage,
    },
    errors: raw.errors,
    isError: raw.is_error,
    subtype: raw.subtype,
  };

  const resultMessage: ClientMessage = { name: 'message:result', payload: resultPayload };

  if (raw.is_error && Array.isArray(raw.errors) && raw.errors.length > 0) {
    const errorMessages = (raw.errors as unknown[]).filter(
      (e): e is string => typeof e === 'string',
    );
    if (errorMessages.length > 0) {
      return [
        resultMessage,
        { name: 'error:message', payload: { message: errorMessages.join('; ') } },
      ];
    }
  }

  return resultMessage;
}
