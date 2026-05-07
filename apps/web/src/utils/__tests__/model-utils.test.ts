import type { ModelInfo } from '@code-quest/shared';
import { describe, expect, it } from 'vitest';
import { getModelDisplayInfo, getModelInfoDisplayName, shortModelName } from '../model-utils.ts';

const models: ModelInfo[] = [
  {
    value: 'default',
    displayName: 'Default (recommended)',
    description: 'Opus 4.6 · Most capable',
  },
  { value: 'sonnet', displayName: 'Sonnet', description: 'Sonnet 4.6 · Best for everyday tasks' },
  { value: 'haiku', displayName: 'Haiku', description: 'Haiku 4.5 · Fastest for quick answers' },
  { value: 'claude-opus-4-6', displayName: 'Opus 4.6' },
];

describe('shortModelName', () => {
  it('returns displayName when model value matches', () => {
    expect(shortModelName('sonnet', models)).toBe('Sonnet');
  });

  it('returns displayName for full model ID', () => {
    expect(shortModelName('claude-opus-4-6', models)).toBe('Opus 4.6');
  });

  it('returns displayName via substring match for model ID with suffix', () => {
    expect(shortModelName('claude-opus-4-6[1m]', models)).toBe('Opus 4.6');
  });

  it('strips [1m] suffix and matches base ID', () => {
    expect(shortModelName('claude-opus-4-6[1m]', models)).toBe('Opus 4.6');
  });

  it('returns default displayName when only shorthand models available', () => {
    const shorthandOnly: ModelInfo[] = [
      { value: 'default', displayName: 'Default (recommended)', supportsFastMode: true },
      { value: 'sonnet', displayName: 'Sonnet' },
      { value: 'haiku', displayName: 'Haiku' },
    ];
    // Real CLI: model = "claude-opus-4-6[1m]" but models only have "default"
    // No match possible — should return raw ID
    expect(shortModelName('claude-opus-4-6[1m]', shorthandOnly)).toBe('claude-opus-4-6[1m]');
  });

  it('returns raw ID when no match', () => {
    expect(shortModelName('gpt-4o', models)).toBe('gpt-4o');
  });

  it('returns raw ID when models is empty', () => {
    expect(shortModelName('sonnet', [])).toBe('sonnet');
  });
});

describe('getModelDisplayInfo', () => {
  it('returns displayName and description for matched model', () => {
    const result = getModelDisplayInfo('sonnet', models);
    expect(result.displayName).toBe('Sonnet');
    expect(result.subLabel).toBe('Sonnet 4.6 · Best for everyday tasks');
  });

  it('returns displayName with value as subLabel when no description', () => {
    const result = getModelDisplayInfo('claude-opus-4-6', models);
    expect(result.displayName).toBe('Opus 4.6');
    expect(result.subLabel).toBe('claude-opus-4-6');
  });

  it('returns raw ID when no match', () => {
    const result = getModelDisplayInfo('unknown-model', models);
    expect(result.displayName).toBe('unknown-model');
    expect(result.subLabel).toBe('unknown-model');
  });

  it('sentinel empty string returns Default (recommended)', () => {
    const result = getModelDisplayInfo('', models, 'Most capable');
    expect(result.displayName).toBe('Default (recommended)');
    expect(result.subLabel).toContain('Most capable');
  });
});

describe('getModelInfoDisplayName', () => {
  it('uses ModelInfo.displayName when available', () => {
    const result = getModelInfoDisplayName(
      { value: 'claude-sonnet-4-6', displayName: 'Sonnet 4.6 (CLI)', description: 'From CLI' },
      'claude-sonnet-4-6',
    );
    expect(result.displayName).toBe('Sonnet 4.6 (CLI)');
    expect(result.subLabel).toBe('From CLI');
  });

  it('falls back to availableModels when ModelInfo has no displayName', () => {
    const result = getModelInfoDisplayName({ value: 'sonnet' }, 'sonnet', models);
    expect(result.displayName).toBe('Sonnet');
  });

  it('falls back to raw ID when no ModelInfo and no match', () => {
    const result = getModelInfoDisplayName(undefined, 'unknown-model', models);
    expect(result.displayName).toBe('unknown-model');
  });
});
