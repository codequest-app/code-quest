import type { ModelTier } from './smart-router.ts';

export interface ModelDefinition {
  id: ModelTier;
  name: string;
  icon: string;
  inputCostPer1k: number;
  outputCostPer1k: number;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export const MODEL_DEFINITIONS: ModelDefinition[] = [
  {
    id: 'haiku',
    name: 'Claude Haiku',
    icon: '🌸',
    inputCostPer1k: 0.00025,
    outputCostPer1k: 0.00125,
  },
  {
    id: 'sonnet',
    name: 'Claude Sonnet',
    icon: '🎵',
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
  },
  { id: 'opus', name: 'Claude Opus', icon: '👑', inputCostPer1k: 0.015, outputCostPer1k: 0.075 },
];

export function getModelDefinition(id: ModelTier): ModelDefinition | undefined {
  return MODEL_DEFINITIONS.find((m) => m.id === id);
}

export function calculateCost(model: ModelTier, tokens: TokenUsage): number {
  const def = getModelDefinition(model);
  if (!def) return 0;
  return (
    (tokens.inputTokens / 1000) * def.inputCostPer1k +
    (tokens.outputTokens / 1000) * def.outputCostPer1k
  );
}
