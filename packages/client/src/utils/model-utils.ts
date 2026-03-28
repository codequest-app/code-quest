import type { ModelInfo } from '@code-quest/shared';

export function shortModelName(id: string): string {
  const lower = id.toLowerCase();
  return (
    (
      [
        ['opus', 'Opus'],
        ['sonnet', 'Sonnet'],
        ['haiku', 'Haiku'],
      ] as const
    ).find(([key]) => lower.includes(key))?.[1] ?? id
  );
}

export interface ModelDisplayInfo {
  displayName: string;
  subLabel: string;
}

export function getModelDisplayInfo(id: string, defaultModel?: string | null): ModelDisplayInfo {
  // Sentinel "" → Default (recommended)
  if (id === '') {
    return {
      displayName: 'Default (recommended)',
      subLabel: defaultModel
        ? `${defaultModel} · Most capable for complex work`
        : 'Most capable for complex work',
    };
  }
  const lower = id.toLowerCase();
  if (lower.includes('opus')) {
    return { displayName: 'Opus 4.6', subLabel: id };
  }
  if (lower.includes('sonnet')) {
    return { displayName: 'Sonnet', subLabel: 'Sonnet 4.6 · Best for everyday tasks' };
  }
  if (lower.includes('haiku')) {
    return { displayName: 'Haiku', subLabel: 'Haiku 4.5 · Fastest for quick answers' };
  }
  return { displayName: id, subLabel: id };
}

export function getModelInfoDisplayName(
  info: ModelInfo | undefined,
  fallbackId: string,
): ModelDisplayInfo {
  if (info?.displayName) {
    return { displayName: info.displayName, subLabel: info.description ?? fallbackId };
  }
  return getModelDisplayInfo(fallbackId);
}
