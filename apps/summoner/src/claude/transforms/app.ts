import type { ClientMessage } from '@code-quest/shared';
import type { z } from 'zod';
import type { availableModelsSchema, experimentGatesSchema } from '../schemas.ts';

type ExperimentGatesMessage = z.infer<typeof experimentGatesSchema>;
type AvailableModelsMessage = z.infer<typeof availableModelsSchema>;

export function transformExperimentGates(raw: ExperimentGatesMessage): ClientMessage {
  const gates: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(raw.gates)) {
    gates[k] = Boolean(v);
  }
  return { name: 'app:experiment_gates', payload: { gates } };
}

export function transformAvailableModels(raw: AvailableModelsMessage): ClientMessage {
  return {
    name: 'app:models',
    payload: { models: raw.models },
  };
}
