import { modelUsageEntrySchema } from '@code-quest/shared';
import { z } from 'zod';
import type { ClientMessage } from '../../types.ts';
import type { resultSchema } from '../schemas.ts';

type ResultMessage = z.infer<typeof resultSchema>;

const modelUsageRecordSchema = z.record(z.string(), modelUsageEntrySchema);

export function transformResult(raw: ResultMessage): ClientMessage | ClientMessage[] {
  const usage = raw.usage;
  const parsedModelUsage = raw.modelUsage
    ? modelUsageRecordSchema.safeParse(raw.modelUsage)
    : undefined;
  const resultPayload = {
    stats: {
      totalCostUsd: raw.total_cost_usd,
      durationMs: raw.duration_ms,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
      cacheReadInputTokens: usage?.cache_read_input_tokens,
      cacheCreationInputTokens: usage?.cache_creation_input_tokens,
      numTurns: raw.num_turns,
      modelUsage: parsedModelUsage?.success ? parsedModelUsage.data : undefined,
    },
    errors: raw.errors,
    isError: raw.is_error,
    subtype: raw.subtype,
  };

  const resultMessage: ClientMessage = { name: 'message:result', payload: resultPayload };

  const isAborted = raw.terminal_reason === 'aborted_streaming';

  if (raw.is_error && Array.isArray(raw.errors) && raw.errors.length > 0) {
    const toErrorMessage = (message: string): ClientMessage => ({
      name: 'error:message',
      payload: { message, kind: classifyErrorKind(message, isAborted) },
    });
    return [resultMessage, ...raw.errors.map(toErrorMessage)];
  }

  if (raw.is_error && raw.result) {
    return [
      resultMessage,
      {
        name: 'error:message',
        payload: { message: raw.result, kind: classifyErrorKind(raw.result, isAborted) },
      },
    ];
  }

  return resultMessage;
}

function classifyErrorKind(message: string, isAborted: boolean): string | undefined {
  if (message.startsWith('[ede_diagnostic]')) return 'ede_diagnostic';
  if (isAborted) return 'aborted';
  return undefined;
}
