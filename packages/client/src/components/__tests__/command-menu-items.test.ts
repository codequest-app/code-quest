import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAttachFileFeature } from '../../features/attach-file/attach-file-feature';
import { btwSignal, createBtwFeature } from '../../features/btw/btw-feature';
import { createClearFeature } from '../../features/clear/clear-feature';
import { createEffortFeature } from '../../features/effort/effort-feature';
import { createFastModeFeature } from '../../features/fast-mode/fast-mode-feature';
import { createManagePluginsFeature } from '../../features/manage-plugins/manage-plugins-feature';
import { createMcpServersFeature } from '../../features/mcp-servers/mcp-servers-feature';
import { createMcpStatusFeature } from '../../features/mcp-status/mcp-status-feature';
import { createMentionFileFeature } from '../../features/mention-file/mention-file-feature';
import { createThinkingFeature } from '../../features/thinking/thinking-feature';

import type { MenuItemFeature, SlashCommandFeature } from '../../lib/feature';
import { createFeatureRegistry } from '../../lib/feature-registry';
import { type BuildMenuItemsParams, buildMenuItems } from '../command-menu-items';

function defaultParams(overrides?: Partial<BuildMenuItemsParams>): BuildMenuItemsParams {
  return {
    slashCommands: [],
    slashFilter: null,
    modelLabel: 'Opus',
    registry: createFeatureRegistry(),
    close: vi.fn(),
    closeSilent: vi.fn(),
    compose: { executeSlashCommand: vi.fn() },
    ...overrides,
  };
}

describe('buildMenuItems', () => {
  afterEach(() => {
    btwSignal.setState({ open: false, question: '', answer: null, loading: false, error: null });
  });
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

  it('context section includes attach-file from registry MenuItemFeature', () => {
    const registry = createFeatureRegistry();
    const onAttachFile = vi.fn();
    registry.register(createAttachFileFeature({ onAttachFile }));
    const { context } = buildMenuItems(defaultParams({ registry }));
    expect(context.map((i) => i.id)).toContain('attach-file');
  });

  it('clicking attach-file calls onAttachFile + closeSilent', () => {
    const closeSilent = vi.fn();
    const onAttachFile = vi.fn();
    const registry = createFeatureRegistry();
    registry.register(createAttachFileFeature({ onAttachFile }));
    const { context } = buildMenuItems(defaultParams({ closeSilent, registry }));
    const item = context.find((i) => i.id === 'attach-file');
    item?.onClick?.();
    expect(onAttachFile).toHaveBeenCalled();
    expect(closeSilent).toHaveBeenCalled();
  });

  it('context section includes mention-file from registry MenuItemFeature', () => {
    const registry = createFeatureRegistry();
    const mentionFile = vi.fn();
    registry.register(createMentionFileFeature({ mentionFile }));
    const { context } = buildMenuItems(defaultParams({ registry }));
    expect(context.map((i) => i.id)).toContain('mention-file');
  });

  it('clicking mention-file calls mentionFile + close', () => {
    const close = vi.fn();
    const mentionFile = vi.fn();
    const registry = createFeatureRegistry();
    registry.register(createMentionFileFeature({ mentionFile }));
    const { context } = buildMenuItems(defaultParams({ close, registry }));
    const item = context.find((i) => i.id === 'mention-file');
    item?.onClick?.();
    expect(mentionFile).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it('context section includes clear item from registry MenuItemFeature', () => {
    const registry = createFeatureRegistry();
    const clearMessages = vi.fn();
    const clearModifiedFiles = vi.fn();
    registry.register(
      createClearFeature({ clearMessages, clearModifiedFiles, sendMessage: vi.fn() }),
    );
    const { context } = buildMenuItems(defaultParams({ registry }));
    expect(context.map((i) => i.id)).toContain('clear');
  });

  it('slash section maps slashCommands to menu items sorted by label', () => {
    const { slash } = buildMenuItems(defaultParams({ slashCommands: ['help', 'review'] }));
    expect(slash).toHaveLength(3);
    expect(slash[0].id).toBe('btw');
    expect(slash[1].label).toBe('/help');
    expect(slash[2].label).toBe('/review');
  });

  it('model section includes fast-mode when supportsFastMode is true', () => {
    const localFeatures = [createFastModeFeature({ fastModeState: null, setFastMode: vi.fn() })];
    const { model } = buildMenuItems(defaultParams({ localFeatures }));
    expect(model.map((i) => i.id)).toContain('fast-mode');
  });

  it('model section excludes fast-mode when supportsFastMode is false', () => {
    const { model } = buildMenuItems(defaultParams());
    expect(model.map((i) => i.id)).not.toContain('fast-mode');
  });

  it('model section order: switch model → effort → thinking → fast-mode → account & usage', () => {
    const registry = createFeatureRegistry();
    const modelFeature: MenuItemFeature = {
      id: 'model',
      menuItem: { label: 'Switch model', section: 'Model', order: 0 },
      execute: vi.fn(),
    };
    const usageFeature: MenuItemFeature = {
      id: 'usage',
      menuItem: { label: 'Account & usage', section: 'Model' },
      execute: vi.fn(),
    };
    registry.register(modelFeature);
    registry.register(usageFeature);
    const localFeatures = [
      createEffortFeature({ effort: null, effortLevels: ['low', 'max'], onSetEffort: vi.fn() }),
      createThinkingFeature({ isThinkingOn: false, onSetThinkingLevel: vi.fn() }),
      createFastModeFeature({ fastModeState: null, setFastMode: vi.fn() }),
    ];
    const { model } = buildMenuItems(defaultParams({ registry, localFeatures }));
    expect(model.map((i) => i.id)).toEqual([
      'model',
      'effort-level',
      'toggle-thinking',
      'fast-mode',
      'usage',
    ]);
  });

  it('clicking clear item calls clearMessages + clearModifiedFiles + close', () => {
    const close = vi.fn();
    const clearMessages = vi.fn();
    const clearModifiedFiles = vi.fn();
    const registry = createFeatureRegistry();
    registry.register(
      createClearFeature({ clearMessages, clearModifiedFiles, sendMessage: vi.fn() }),
    );
    const { context } = buildMenuItems(defaultParams({ close, registry }));
    const item = context.find((i) => i.id === 'clear');
    item?.onClick?.();
    expect(clearMessages).toHaveBeenCalled();
    expect(clearModifiedFiles).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it('effort item label is Effort and description shows level', () => {
    const localFeatures = [
      createEffortFeature({
        effort: 'low',
        effortLevels: ['low', 'medium', 'high', 'max'],
        onSetEffort: vi.fn(),
      }),
    ];
    const { model } = buildMenuItems(defaultParams({ localFeatures }));
    const effortItem = model.find((i) => i.id === 'effort-level');
    expect(effortItem?.label).toBe('Effort');
    expect(effortItem?.description).toBe('(Low)');
  });

  it('effort item has no description when no level set', () => {
    const localFeatures = [
      createEffortFeature({
        effort: null,
        effortLevels: ['low', 'medium', 'high', 'max'],
        onSetEffort: vi.fn(),
      }),
    ];
    const { model } = buildMenuItems(defaultParams({ localFeatures }));
    const effortItem = model.find((i) => i.id === 'effort-level');
    expect(effortItem?.label).toBe('Effort');
    expect(effortItem?.description).toBeUndefined();
  });

  it('context section includes rewind item from registry MenuItemFeature', () => {
    const registry = createFeatureRegistry();
    const rewindFeature: MenuItemFeature = {
      id: 'rewind',
      menuItem: { label: 'Rewind', section: 'Context' },
      execute: vi.fn(),
    };
    registry.register(rewindFeature);
    const { context } = buildMenuItems(defaultParams({ registry }));
    expect(context.map((i) => i.id)).toContain('rewind');
  });

  describe('/btw item', () => {
    it('is always present in slash section', () => {
      const { slash } = buildMenuItems(defaultParams());
      expect(slash.some((i) => i.id === 'btw')).toBe(true);
    });

    it('is disabled when slashFilter has no question text', () => {
      const { slash } = buildMenuItems(defaultParams({ slashFilter: 'btw' }));
      const btw = slash.find((i) => i.id === 'btw');
      expect(btw?.disabled).toBe(true);
    });

    it('is enabled when slashFilter is "btw <question>"', () => {
      const { slash } = buildMenuItems(defaultParams({ slashFilter: 'btw hello world' }));
      const btw = slash.find((i) => i.id === 'btw');
      expect(btw?.disabled).toBe(false);
    });

    it('invokes btw feature with question when clicked', () => {
      const close = vi.fn();
      const askSideQuestion = vi.fn().mockResolvedValue({ ok: true, data: { answer: '4' } });
      const registry = createFeatureRegistry();
      registry.register(createBtwFeature({ askSideQuestion }));
      const { slash } = buildMenuItems(
        defaultParams({ slashFilter: 'btw what is 2+2?', close, registry }),
      );
      const btw = slash.find((i) => i.id === 'btw');
      btw?.onClick?.();
      expect(askSideQuestion).toHaveBeenCalledWith('what is 2+2?');
      expect(close).toHaveBeenCalled();
    });

    it('does not invoke btw feature when question is empty', () => {
      const askSideQuestion = vi.fn();
      const registry = createFeatureRegistry();
      registry.register(createBtwFeature({ askSideQuestion }));
      const { slash } = buildMenuItems(defaultParams({ slashFilter: 'btw', registry }));
      const btw = slash.find((i) => i.id === 'btw');
      btw?.onClick?.();
      expect(askSideQuestion).not.toHaveBeenCalled();
    });
  });

  it('customize section includes mcp-status, mcp-servers, plugins from registry', () => {
    const registry = createFeatureRegistry();
    registry.register(createMcpStatusFeature({ onMcpStatus: vi.fn() }));
    registry.register(createMcpServersFeature({ onToggleMcp: vi.fn() }));
    registry.register(createManagePluginsFeature({ onManagePlugins: vi.fn() }));
    const { customize } = buildMenuItems(defaultParams({ registry }));
    expect(customize.map((i) => i.id)).toContain('mcp-status');
    expect(customize.map((i) => i.id)).toContain('mcp-servers');
    expect(customize.map((i) => i.id)).toContain('plugins');
  });

  it('clicking mcp-status calls onMcpStatus + closeSilent', () => {
    const closeSilent = vi.fn();
    const onMcpStatus = vi.fn();
    const registry = createFeatureRegistry();
    registry.register(createMcpStatusFeature({ onMcpStatus }));
    const { customize } = buildMenuItems(defaultParams({ closeSilent, registry }));
    customize.find((i) => i.id === 'mcp-status')?.onClick?.();
    expect(onMcpStatus).toHaveBeenCalled();
    expect(closeSilent).toHaveBeenCalled();
  });

  it('slash section includes registry SlashCommandFeature with execute', () => {
    const registry = createFeatureRegistry();
    const feature: SlashCommandFeature = {
      id: 'reload-plugins',
      command: '/reload-plugins',
      invoke: vi.fn(),
      execute: vi.fn(),
    };
    registry.register(feature);
    const { slash } = buildMenuItems(defaultParams({ registry }));
    expect(slash.map((i) => i.id)).toContain('reload-plugins');
  });

  it('clicking registry slash feature calls feature.execute + close', () => {
    const close = vi.fn();
    const execute = vi.fn();
    const registry = createFeatureRegistry();
    const feature: SlashCommandFeature = {
      id: 'reload-plugins',
      command: '/reload-plugins',
      invoke: vi.fn(),
      execute,
    };
    registry.register(feature);
    const { slash } = buildMenuItems(defaultParams({ registry, close }));
    const item = slash.find((i) => i.id === 'reload-plugins');
    item?.onClick?.();
    expect(execute).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it('clicking registry rewind feature calls feature.execute + close', () => {
    const close = vi.fn();
    const execute = vi.fn();
    const registry = createFeatureRegistry();
    const feature: MenuItemFeature = {
      id: 'rewind',
      menuItem: { label: 'Rewind', section: 'Context' },
      execute,
    };
    registry.register(feature);
    const { context } = buildMenuItems(defaultParams({ registry, close }));
    const item = context.find((i) => i.id === 'rewind');
    item?.onClick?.();
    expect(execute).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });
});
