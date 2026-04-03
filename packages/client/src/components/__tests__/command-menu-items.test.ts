import { describe, expect, it, vi } from 'vitest';
import { type BuildMenuItemsParams, buildMenuItems } from '../command-menu-items';

function defaultParams(overrides?: Partial<BuildMenuItemsParams>): BuildMenuItemsParams {
  return {
    slashCommands: [],
    effort: null,
    effortLevels: ['low', 'medium', 'high', 'max'],
    isThinkingOn: false,
    isFastMode: false,
    fastModeState: null,
    modelLabel: 'Opus',
    supportsFastMode: false,
    onSetEffort: vi.fn(),
    onSetThinkingLevel: vi.fn(),
    setFastMode: vi.fn(),
    close: vi.fn(),
    compose: { mentionFile: vi.fn(), executeSlashCommand: vi.fn() },
    actions: { sendMessage: vi.fn(), clearMessages: vi.fn(), clearModifiedFiles: vi.fn() },
    callbacks: {},
    ...overrides,
  };
}

describe('buildMenuItems', () => {
  it('returns all 7 sections', () => {
    const sections = buildMenuItems(defaultParams());
    expect(Object.keys(sections)).toEqual([
      'context',
      'model',
      'customize',
      'tools',
      'slash',
      'settings',
      'support',
    ]);
  });

  it('context section has attach-file, mention-file, clear-conversation', () => {
    const { context } = buildMenuItems(defaultParams());
    expect(context.map((i) => i.id)).toContain('attach-file');
    expect(context.map((i) => i.id)).toContain('mention-file');
    expect(context.map((i) => i.id)).toContain('clear-conversation');
  });

  it('slash section maps slashCommands to menu items', () => {
    const { slash } = buildMenuItems(defaultParams({ slashCommands: ['help', 'review'] }));
    expect(slash).toHaveLength(2);
    expect(slash[0].label).toBe('/help');
    expect(slash[1].label).toBe('/review');
  });

  it('model section includes fast-mode when supportsFastMode is true', () => {
    const { model } = buildMenuItems(defaultParams({ supportsFastMode: true }));
    expect(model.map((i) => i.id)).toContain('fast-mode');
  });

  it('model section excludes fast-mode when supportsFastMode is false', () => {
    const { model } = buildMenuItems(defaultParams({ supportsFastMode: false }));
    expect(model.map((i) => i.id)).not.toContain('fast-mode');
  });

  it('clicking clear-conversation calls clearMessages + clearModifiedFiles + close', () => {
    const close = vi.fn();
    const clearMessages = vi.fn();
    const clearModifiedFiles = vi.fn();
    const { context } = buildMenuItems(
      defaultParams({
        close,
        actions: { sendMessage: vi.fn(), clearMessages, clearModifiedFiles },
      }),
    );
    const item = context.find((i) => i.id === 'clear-conversation');
    item?.onClick?.();
    expect(clearMessages).toHaveBeenCalled();
    expect(clearModifiedFiles).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it('context section includes rewind item', () => {
    const { context } = buildMenuItems(defaultParams());
    expect(context.map((i) => i.id)).toContain('rewind');
  });

  it('clicking rewind calls callbacks.onRewind + close', () => {
    const close = vi.fn();
    const onRewind = vi.fn();
    const { context } = buildMenuItems(defaultParams({ close, callbacks: { onRewind } }));
    const item = context.find((i) => i.id === 'rewind');
    item?.onClick?.();
    expect(onRewind).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });
});
