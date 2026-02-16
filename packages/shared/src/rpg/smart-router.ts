export interface ComplexityAnalysis {
  total: number;
  lengthScore: number;
  keywordScore: number;
  multiStepScore: number;
}

export type ModelTier = 'haiku' | 'sonnet' | 'opus';
export type CostTier = 'low' | 'medium' | 'high';

export interface ModelRecommendation {
  model: ModelTier;
  costTier: CostTier;
  reason: string;
}

const WORKTREE_THRESHOLD = 8;

export function recommendModel(analysis: ComplexityAnalysis): ModelRecommendation {
  if (analysis.total <= 4) {
    return { model: 'haiku', costTier: 'low', reason: 'Simple task — fast and cheap' };
  }
  if (analysis.total <= 9) {
    return { model: 'sonnet', costTier: 'medium', reason: 'Moderate complexity — balanced' };
  }
  return { model: 'opus', costTier: 'high', reason: 'Complex task — maximum capability' };
}

export function shouldUseWorktree(analysis: ComplexityAnalysis): boolean {
  return analysis.total >= WORKTREE_THRESHOLD;
}
