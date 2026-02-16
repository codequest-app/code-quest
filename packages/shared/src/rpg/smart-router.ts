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

const HIGH_COMPLEXITY_KEYWORDS = ['refactor', 'architect', 'migrate', 'redesign'];
const MEDIUM_COMPLEXITY_KEYWORDS = ['fix', 'add', 'update'];
const MULTI_STEP_INDICATORS = ['and', 'then', 'also', 'step', 'first', 'second'];

export function analyzeComplexity(prompt: string): ComplexityAnalysis {
  const len = prompt.length;
  let lengthScore = 0;
  if (len >= 800) lengthScore = 5;
  else if (len >= 400) lengthScore = 4;
  else if (len >= 200) lengthScore = 3;
  else if (len >= 100) lengthScore = 2;
  else if (len >= 50) lengthScore = 1;

  const lower = prompt.toLowerCase();
  let keywordScore = 0;
  for (const kw of HIGH_COMPLEXITY_KEYWORDS) {
    if (lower.includes(kw)) keywordScore += 2;
  }
  for (const kw of MEDIUM_COMPLEXITY_KEYWORDS) {
    if (lower.includes(kw)) keywordScore += 1;
  }
  keywordScore = Math.min(5, keywordScore);

  let multiStepScore = 0;
  for (const indicator of MULTI_STEP_INDICATORS) {
    if (lower.includes(indicator)) multiStepScore += 1;
  }
  multiStepScore = Math.min(5, multiStepScore);

  const total = lengthScore + keywordScore + multiStepScore;
  return { total, lengthScore, keywordScore, multiStepScore };
}

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
