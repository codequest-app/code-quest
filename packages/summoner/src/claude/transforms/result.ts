import type { z } from 'zod';
import type { ClientMessage } from '../../types.ts';
import type { resultSchema } from '../schemas.ts';

type ResultMessage = z.infer<typeof resultSchema>;

export function transformResult(raw: ResultMessage): ClientMessage | ClientMessage[] {
  const usage = raw.usage;
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
    return [resultMessage, { name: 'error:message', payload: { message: raw.errors.join('; ') } }];
  }

  return resultMessage;
}
