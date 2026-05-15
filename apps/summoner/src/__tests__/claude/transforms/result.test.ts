import { segments as s } from '@code-quest/test-kit';
import { describe, expect, it } from 'vitest';
import { expectName, toClientMessage, transformResult } from '../helpers.ts';

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

  it('result with is_error but no errors array and no result string → emits only message:result', () => {
    const base = JSON.parse(s.result());
    base.is_error = true;
    base.subtype = 'error_max_turns';
    base.result = '';
    delete base.errors;
    const result = toClientMessage(JSON.stringify(base));
    expect(result).toMatchObject({
      name: 'message:result',
      payload: { isError: true, subtype: 'error_max_turns' },
    });
  });

  it('result with is_error + errors: null + result string → emits [message:result, error:message]', () => {
    const raw = s.resultWithError("You've hit your limit · resets 11pm (Asia/Taipei)");
    const result = transformResult(raw);
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0]).toMatchObject({
      name: 'message:result',
      payload: { isError: true },
    });
    expect(result.messages[1]).toMatchObject({
      name: 'error:message',
      payload: { message: "You've hit your limit · resets 11pm (Asia/Taipei)" },
    });
  });

  it('classifies aborted_streaming errors as kind="aborted"', () => {
    const base = JSON.parse(s.result());
    base.is_error = true;
    base.subtype = 'error_during_execution';
    base.terminal_reason = 'aborted_streaming';
    base.errors = [
      '[ede_diagnostic] result_type=user last_content_type=n/a stop_reason=null',
      'Error: Request was aborted.\n    at makeRequest',
    ];
    const result = transformResult(JSON.stringify(base));
    const errorMsgs = result.messages.filter((m) => m.name === 'error:message');
    expect(errorMsgs).toHaveLength(2);
    expect(errorMsgs[0]).toMatchObject({
      name: 'error:message',
      payload: {
        kind: 'ede_diagnostic',
        message: '[ede_diagnostic] result_type=user last_content_type=n/a stop_reason=null',
      },
    });
    expect(errorMsgs[1]).toMatchObject({
      name: 'error:message',
      payload: { kind: 'aborted', message: expect.stringContaining('Request was aborted') },
    });
  });

  it('non-aborted errors have no kind (plain error)', () => {
    const base = JSON.parse(s.result());
    base.is_error = true;
    base.subtype = 'error_max_turns';
    base.errors = ['Max turns exceeded'];
    const result = transformResult(JSON.stringify(base));
    const errorMsgs = result.messages.filter((m) => m.name === 'error:message');
    expect(errorMsgs).toHaveLength(1);
    expect(errorMsgs[0]!.payload.kind).toBeUndefined();
    expect(errorMsgs[0]!.payload.message).toBe('Max turns exceeded');
  });

  it('handles result without is_error/subtype (backward compat)', () => {
    const base = JSON.parse(s.result());
    base.total_cost_usd = 0.05;
    base.duration_ms = 1000;
    base.usage = {};
    delete base.is_error;
    delete base.subtype;
    const result = toClientMessage(JSON.stringify(base));
    const msg = expectName(result, 'message:result');
    expect(msg.payload.isError).toBeUndefined();
    expect(msg.payload.subtype).toBeUndefined();
  });
});
