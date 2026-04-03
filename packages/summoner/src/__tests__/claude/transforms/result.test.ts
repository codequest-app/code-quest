// biome-ignore-all lint/suspicious/noExplicitAny: ClientMessage payload is Record<string,unknown>, needs cast in assertions
import { describe, expect, it } from 'vitest';
import { segments as s } from '../../../test/fake-claude.ts';
import { toClientMessage, transformResult } from '../helpers.ts';

describe('transform — result events', () => {
  it('converts result with stats', () => {
    const base = JSON.parse(s.result());
    base.total_cost_usd = 0.05;
    base.duration_ms = 1234;
    base.usage = { input_tokens: 100, output_tokens: 200 };
    base.num_turns = 3;
    base.errors = ['something failed'];
    const result = toClientMessage(JSON.stringify(base));
    expect(result).toMatchObject({
      name: 'message:result',
      payload: {
        stats: { totalCostUsd: 0.05, inputTokens: 100, outputTokens: 200 },
        errors: ['something failed'],
      },
    });
  });

  it('extracts isError and subtype from result event with errors → emits [message:result, error:message]', () => {
    const base = JSON.parse(s.result());
    base.is_error = true;
    base.subtype = 'error_max_turns';
    base.total_cost_usd = 0.1;
    base.duration_ms = 5000;
    base.usage = { input_tokens: 100, output_tokens: 50 };
    base.errors = ['Max turns exceeded'];
    const result = transformResult(JSON.stringify(base));
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0]).toMatchObject({
      name: 'message:result',
      payload: { isError: true, subtype: 'error_max_turns' },
    });
    expect(result.messages[1]).toMatchObject({
      name: 'error:message',
      payload: { message: 'Max turns exceeded' },
    });
  });

  it('result with is_error but no errors array → emits only message:result', () => {
    const base = JSON.parse(s.result());
    base.is_error = true;
    base.subtype = 'error_max_turns';
    delete base.errors;
    const result = toClientMessage(JSON.stringify(base));
    expect(result).toMatchObject({
      name: 'message:result',
      payload: { isError: true, subtype: 'error_max_turns' },
    });
  });

  it('handles result without is_error/subtype (backward compat)', () => {
    const base = JSON.parse(s.result());
    base.total_cost_usd = 0.05;
    base.duration_ms = 1000;
    base.usage = {};
    delete base.is_error;
    delete base.subtype;
    const result = toClientMessage(JSON.stringify(base));
    expect(result).toMatchObject({ name: 'message:result' });
    expect((result as any).payload.isError).toBeUndefined();
    expect((result as any).payload.subtype).toBeUndefined();
  });
});
