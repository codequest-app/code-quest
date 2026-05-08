import { describe, expect, it } from 'vitest';
import { segments as s } from '../../../test/segments-node.ts';
import { toClientMessage } from '../helpers.ts';

describe('transform — app', () => {
  it('converts experiment_gates', () => {
    expect(toClientMessage(s.experimentGates({ feature_a: true, feature_b: false }))).toMatchObject(
      {
        name: 'app:experiment_gates',
        payload: { gates: { feature_a: true, feature_b: false } },
      },
    );
  });

  it('coerces string gate values to boolean', () => {
    const result = toClientMessage(s.experimentGates({ flag: 'truthy' }));
    expect(result).toMatchObject({
      name: 'app:experiment_gates',
      payload: { gates: { flag: true } },
    });
  });

  it('converts available_models', () => {
    const models = [{ id: 'opus', name: 'Opus' }];
    const result = toClientMessage(JSON.stringify({ type: 'available_models', models }));
    expect(result).toMatchObject({
      name: 'app:models',
      payload: { models },
    });
  });
});
