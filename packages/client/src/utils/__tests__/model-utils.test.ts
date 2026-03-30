import type { ProviderClientConfig } from '@code-quest/shared';
import { describe, expect, it } from 'vitest';
import { getModelDisplayInfo, getModelInfoDisplayName, shortModelName } from '../model-utils';

const modelDisplayMap: ProviderClientConfig['modelDisplayMap'] = [
  { pattern: 'opus', displayName: 'Opus 4.6', supportsFastMode: true },
  { pattern: 'sonnet', displayName: 'Sonnet', subLabel: 'Sonnet 4.6 · Best for everyday tasks' },
  { pattern: 'haiku', displayName: 'Haiku', subLabel: 'Haiku 4.5 · Fastest for quick answers' },
];

describe('shortModelName', () => {
  it('returns displayName from modelDisplayMap when pattern matches', () => {
    expect(shortModelName('claude-sonnet-4-6', modelDisplayMap)).toBe('Sonnet');
  });

  it('returns displayName for opus', () => {
    expect(shortModelName('claude-opus-4-6', modelDisplayMap)).toBe('Opus 4.6');
  });

  it('returns raw ID when no pattern matches', () => {
    expect(shortModelName('gpt-4o', modelDisplayMap)).toBe('gpt-4o');
  });

  it('returns raw ID when modelDisplayMap is empty', () => {
    expect(shortModelName('claude-sonnet-4-6', [])).toBe('claude-sonnet-4-6');
  });
});

describe('getModelDisplayInfo', () => {
  it('returns mapped displayName and subLabel for sonnet', () => {
    const result = getModelDisplayInfo('claude-sonnet-4-6', null, modelDisplayMap);
    expect(result.displayName).toBe('Sonnet');
    expect(result.subLabel).toBe('Sonnet 4.6 · Best for everyday tasks');
  });

  it('returns mapped displayName for opus with model ID as subLabel', () => {
    const result = getModelDisplayInfo('claude-opus-4-6', null, modelDisplayMap);
    expect(result.displayName).toBe('Opus 4.6');
    expect(result.subLabel).toBe('claude-opus-4-6');
  });

  it('returns raw ID when no pattern matches', () => {
    const result = getModelDisplayInfo('unknown-model', null, modelDisplayMap);
    expect(result.displayName).toBe('unknown-model');
    expect(result.subLabel).toBe('unknown-model');
  });

  it('sentinel empty string returns Default (recommended)', () => {
    const result = getModelDisplayInfo('', 'claude-sonnet-4-6', modelDisplayMap, 'Most capable');
    expect(result.displayName).toBe('Default (recommended)');
    expect(result.subLabel).toContain('Most capable');
  });
});

describe('getModelInfoDisplayName', () => {
  it('uses ModelInfo.displayName when available', () => {
    const result = getModelInfoDisplayName(
      { value: 'claude-sonnet-4-6', displayName: 'Sonnet 4.6 (CLI)', description: 'From CLI' },
      'claude-sonnet-4-6',
      modelDisplayMap,
    );
    expect(result.displayName).toBe('Sonnet 4.6 (CLI)');
    expect(result.subLabel).toBe('From CLI');
  });

  it('falls back to modelDisplayMap when ModelInfo has no displayName', () => {
    const result = getModelInfoDisplayName(
      { value: 'claude-sonnet-4-6' },
      'claude-sonnet-4-6',
      modelDisplayMap,
    );
    expect(result.displayName).toBe('Sonnet');
  });

  it('falls back to raw ID when no ModelInfo and no map match', () => {
    const result = getModelInfoDisplayName(undefined, 'unknown-model', modelDisplayMap);
    expect(result.displayName).toBe('unknown-model');
  });
});
