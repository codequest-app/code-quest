import { describe, expect, it } from 'vitest';
import type { ComplexityAnalysis } from '../smart-router.ts';
import { analyzeComplexity, recommendModel, shouldUseWorktree } from '../smart-router.ts';

describe('SmartRouter', () => {
  describe('recommendModel', () => {
    it('recommends haiku for low complexity', () => {
      const analysis: ComplexityAnalysis = {
        total: 2,
        lengthScore: 1,
        keywordScore: 1,
        multiStepScore: 0,
      };
      const rec = recommendModel(analysis);
      expect(rec.model).toBe('haiku');
      expect(rec.reason).toBeDefined();
    });

    it('recommends sonnet for medium complexity', () => {
      const analysis: ComplexityAnalysis = {
        total: 6,
        lengthScore: 2,
        keywordScore: 2,
        multiStepScore: 2,
      };
      const rec = recommendModel(analysis);
      expect(rec.model).toBe('sonnet');
    });

    it('recommends opus for high complexity', () => {
      const analysis: ComplexityAnalysis = {
        total: 11,
        lengthScore: 4,
        keywordScore: 4,
        multiStepScore: 3,
      };
      const rec = recommendModel(analysis);
      expect(rec.model).toBe('opus');
    });

    it('returns cost tier with recommendation', () => {
      const analysis: ComplexityAnalysis = {
        total: 3,
        lengthScore: 1,
        keywordScore: 1,
        multiStepScore: 1,
      };
      const rec = recommendModel(analysis);
      expect(rec.costTier).toBeDefined();
    });
  });

  describe('shouldUseWorktree', () => {
    it('returns false for low complexity', () => {
      const analysis: ComplexityAnalysis = {
        total: 5,
        lengthScore: 2,
        keywordScore: 2,
        multiStepScore: 1,
      };
      expect(shouldUseWorktree(analysis)).toBe(false);
    });

    it('returns true for high complexity (>= 8)', () => {
      const analysis: ComplexityAnalysis = {
        total: 8,
        lengthScore: 3,
        keywordScore: 3,
        multiStepScore: 2,
      };
      expect(shouldUseWorktree(analysis)).toBe(true);
    });

    it('returns true for very high complexity', () => {
      const analysis: ComplexityAnalysis = {
        total: 15,
        lengthScore: 5,
        keywordScore: 5,
        multiStepScore: 5,
      };
      expect(shouldUseWorktree(analysis)).toBe(true);
    });

    it('returns false at boundary (7)', () => {
      const analysis: ComplexityAnalysis = {
        total: 7,
        lengthScore: 3,
        keywordScore: 2,
        multiStepScore: 2,
      };
      expect(shouldUseWorktree(analysis)).toBe(false);
    });
  });

  describe('analyzeComplexity', () => {
    it('returns zero scores for short simple prompt', () => {
      const result = analyzeComplexity('hi');
      expect(result.lengthScore).toBe(0);
      expect(result.keywordScore).toBe(0);
      expect(result.multiStepScore).toBe(0);
      expect(result.total).toBe(0);
    });

    it('scores length based on character thresholds', () => {
      const result = analyzeComplexity('x'.repeat(200));
      expect(result.lengthScore).toBe(3);
    });

    it('scores high-complexity keywords with +2', () => {
      const result = analyzeComplexity('refactor the architecture');
      expect(result.keywordScore).toBeGreaterThanOrEqual(2);
    });

    it('scores medium-complexity keywords with +1', () => {
      const result = analyzeComplexity('fix the bug');
      expect(result.keywordScore).toBe(1);
    });

    it('detects multi-step indicators', () => {
      const result = analyzeComplexity('first add tests and then refactor');
      expect(result.multiStepScore).toBeGreaterThanOrEqual(3);
    });

    it('caps each score at 5', () => {
      const result = analyzeComplexity(
        'refactor architect migrate redesign fix add update ' +
          'first second step then also and ' +
          'x'.repeat(800),
      );
      expect(result.lengthScore).toBeLessThanOrEqual(5);
      expect(result.keywordScore).toBeLessThanOrEqual(5);
      expect(result.multiStepScore).toBeLessThanOrEqual(5);
    });
  });
});
