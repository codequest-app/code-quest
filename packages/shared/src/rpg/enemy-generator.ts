import type { ComplexityScore, Enemy, EnemyType } from './types.ts';

const COMPLEXITY_KEYWORDS = [
  'refactor',
  'architecture',
  'optimize',
  'performance',
  'migrate',
  'integrate',
  'redesign',
  'overhaul',
  'implement',
  'debug',
  'deploy',
  'scale',
  'secure',
  'authentication',
  'database',
];

const MULTI_STEP_MARKERS = [
  'first',
  'then',
  'finally',
  'also',
  'additionally',
  'after that',
  'next',
  'step',
];

const TYPE_MULTIPLIERS: Record<EnemyType, number> = {
  'code-task': 1.0,
  'bug-hunt': 0.8,
  architecture: 1.5,
  documentation: 0.6,
  testing: 0.7,
  optimization: 1.3,
  general: 1.0,
};

const ENEMY_NAMES: Record<EnemyType, string[]> = {
  'code-task': ['Code Golem', 'Syntax Wyrm', 'Logic Beast'],
  'bug-hunt': ['Bug Slime', 'Glitch Beetle', 'Error Phantom'],
  architecture: ['Arch Dragon', 'Pattern Titan', 'Design Hydra'],
  documentation: ['Doc Sprite', 'Scroll Wisp', 'Page Phantom'],
  testing: ['Test Imp', 'Assert Goblin', 'Coverage Shade'],
  optimization: ['Lag Demon', 'Memory Leech', 'Bottleneck Ogre'],
  general: ['Wild Slime', 'Mystery Shade', 'Quest Beast'],
};

export function analyzeEnemyComplexity(prompt: string): ComplexityScore {
  const lower = prompt.toLowerCase();
  const words = lower.split(/\s+/);

  const lengthScore = Math.min(5, Math.floor(words.length / 10));

  let keywordScore = 0;
  for (const kw of COMPLEXITY_KEYWORDS) {
    if (lower.includes(kw)) keywordScore++;
  }
  keywordScore = Math.min(5, keywordScore);

  let multiStepScore = 0;
  for (const marker of MULTI_STEP_MARKERS) {
    if (lower.includes(marker)) multiStepScore++;
  }
  multiStepScore = Math.min(5, multiStepScore);

  const total = Math.min(15, lengthScore + keywordScore + multiStepScore);
  return { total, lengthScore, keywordScore, multiStepScore };
}

export function classifyTaskType(prompt: string): EnemyType {
  const lower = prompt.toLowerCase();

  if (/\b(bug|fix|error|crash|broken|issue|debug)\b/.test(lower)) return 'bug-hunt';
  if (/\b(tests?|spec|assert|coverage|unit test|e2e)\b/.test(lower)) return 'testing';
  if (/\b(architect|refactor|redesign|pattern|structure)\b/.test(lower)) return 'architecture';
  if (/\b(document|documentation|readme|jsdoc|explain)\b/.test(lower)) return 'documentation';
  if (/\b(optimi[sz]e|performance|speed|memory|cache|fast)\b/.test(lower)) return 'optimization';
  if (/\b(implement|create|add|build|make|write|develop|feature)\b/.test(lower)) return 'code-task';

  return 'general';
}

export function calculateHP(level: number, type: EnemyType): number {
  return Math.round(level * 100 * TYPE_MULTIPLIERS[type]);
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function generateEnemy(prompt: string): Enemy {
  const type = classifyTaskType(prompt);
  const complexity = analyzeEnemyComplexity(prompt);
  const level = Math.max(1, Math.min(10, Math.ceil(complexity.total / 1.5)));
  const hp = calculateHP(level, type);

  const names = ENEMY_NAMES[type];
  const nameIndex = simpleHash(prompt) % names.length;

  return {
    name: names[nameIndex],
    type,
    level,
    hp,
    maxHp: hp,
  };
}
