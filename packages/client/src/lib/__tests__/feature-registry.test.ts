import { describe, expect, it, vi } from 'vitest';
import type { Feature, MenuItemFeature, SlashCommandFeature } from '../feature';
import { createFeatureRegistry } from '../feature-registry';

const newFeature = (over: Partial<Feature> = {}): Feature => ({
  id: 'f',
  label: 'F',
  category: 'X',
  execute: vi.fn(),
  ...over,
});

describe('feature-registry', () => {
  describe('findSlashCommand', () => {
    it('finds feature by exact command match (default)', () => {
      const registry = createFeatureRegistry();
      const feature: SlashCommandFeature = {
        id: 'reload-plugins',
        command: '/reload-plugins',
        invoke: () => {},
      };
      registry.register(feature);

      expect(registry.findSlashCommand('/reload-plugins')).toBe(feature);
    });

    it('returns undefined when no feature matches', () => {
      const registry = createFeatureRegistry();
      expect(registry.findSlashCommand('/unknown')).toBeUndefined();
    });

    it('uses custom match when defined', () => {
      const registry = createFeatureRegistry();
      const feature: SlashCommandFeature = {
        id: 'compact',
        command: '/compact',
        match: (msg) => msg.trim().startsWith('/compact'),
        invoke: () => {},
      };
      registry.register(feature);

      expect(registry.findSlashCommand('/compact 50')).toBe(feature);
      expect(registry.findSlashCommand('/compact')).toBe(feature);
      expect(registry.findSlashCommand('/other')).toBeUndefined();
    });

    it('does not match non-SlashCommandFeature', () => {
      const registry = createFeatureRegistry();
      const feature: MenuItemFeature = {
        id: 'rewind',
        menuItem: { label: 'Rewind', section: 'Context' },
        execute: () => {},
      };
      registry.register(feature);

      expect(registry.findSlashCommand('/rewind')).toBeUndefined();
    });
  });

  describe('getSlashCommand', () => {
    it('gets feature by command string', () => {
      const registry = createFeatureRegistry();
      const feature: SlashCommandFeature = {
        id: 'usage',
        command: '/usage',
        invoke: () => {},
      };
      registry.register(feature);

      expect(registry.getSlashCommand('/usage')).toBe(feature);
    });

    it('returns undefined for unknown command', () => {
      const registry = createFeatureRegistry();
      expect(registry.getSlashCommand('/unknown')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('returns all registered features', () => {
      const registry = createFeatureRegistry();
      const f1: SlashCommandFeature = { id: 'a', command: '/a', invoke: () => {} };
      const f2: MenuItemFeature = {
        id: 'b',
        menuItem: { label: 'B', section: 'Context' },
        execute: () => {},
      };
      registry.register(f1);
      registry.register(f2);

      const all = registry.getAll();
      expect(all).toHaveLength(2);
      expect(all).toContain(f1);
      expect(all).toContain(f2);
    });

    it('returns empty array when no features registered', () => {
      const registry = createFeatureRegistry();
      expect(registry.getAll()).toHaveLength(0);
    });
  });

  describe('getSlashCommandFeatures', () => {
    it('returns only SlashCommandFeature instances', () => {
      const registry = createFeatureRegistry();
      const slash: SlashCommandFeature = { id: 'a', command: '/a', invoke: () => {} };
      const menu: MenuItemFeature = {
        id: 'b',
        menuItem: { label: 'B', section: 'Context' },
        execute: () => {},
      };
      registry.register(slash);
      registry.register(menu);

      const result = registry.getSlashCommandFeatures();
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(slash);
    });
  });

  describe('getMenuItemFeatures', () => {
    it('returns only MenuItemFeature instances', () => {
      const registry = createFeatureRegistry();
      const slash: SlashCommandFeature = { id: 'a', command: '/a', invoke: () => {} };
      const menu: MenuItemFeature = {
        id: 'b',
        menuItem: { label: 'B', section: 'Context' },
        execute: () => {},
      };
      registry.register(slash);
      registry.register(menu);

      const result = registry.getMenuItemFeatures();
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(menu);
    });

    it('includes feature that implements both interfaces', () => {
      const registry = createFeatureRegistry();
      const both: SlashCommandFeature & MenuItemFeature = {
        id: 'usage',
        command: '/usage',
        menuItem: { label: 'Account & usage…', section: 'Model' },
        invoke: () => {},
        execute: () => {},
      };
      registry.register(both);

      expect(registry.getSlashCommandFeatures()).toHaveLength(1);
      expect(registry.getMenuItemFeatures()).toHaveLength(1);
    });
  });

  describe('Feature shape support (new unified type)', () => {
    it('getFeatures returns registered Feature objects', () => {
      const r = createFeatureRegistry();
      r.register(newFeature({ id: 'a' }));
      r.register(newFeature({ id: 'b' }));
      expect(r.getFeatures().map((f) => f.id)).toEqual(['a', 'b']);
    });

    it('getMenuItemFeatures adapts new Feature to legacy MenuItemFeature shape', () => {
      const r = createFeatureRegistry();
      r.register(newFeature({ id: 'a', label: 'A', category: 'Cat' }));
      const items = r.getMenuItemFeatures();
      expect(items).toHaveLength(1);
      expect(items[0].menuItem.label).toBe('A');
      expect(items[0].menuItem.section).toBe('Cat');
    });

    it('getMenuItemFeatures merges new Features with legacy MenuItemFeatures', () => {
      const r = createFeatureRegistry();
      r.register(newFeature({ id: 'new-1' }));
      const legacy: MenuItemFeature = {
        id: 'legacy-1',
        menuItem: { label: 'L', section: 'X' },
        execute: vi.fn(),
      };
      r.register(legacy);
      expect(
        r
          .getMenuItemFeatures()
          .map((f) => f.id)
          .sort(),
      ).toEqual(['legacy-1', 'new-1']);
    });

    it('getSlashCommand resolves Feature.slash binding', () => {
      const r = createFeatureRegistry();
      const invoke = vi.fn();
      r.register(
        newFeature({
          id: 'btw',
          slash: { command: '/btw', invoke },
        }),
      );
      const cmd = r.getSlashCommand('/btw');
      expect(cmd?.id).toBe('btw');
      cmd?.invoke('/btw hello');
      expect(invoke).toHaveBeenCalledWith('/btw hello');
    });

    it('findSlashCommand matches via Feature.slash.match', () => {
      const r = createFeatureRegistry();
      r.register(
        newFeature({
          id: 'hello',
          slash: {
            command: '/hello',
            match: (m) => m.trim().startsWith('/hello'),
            invoke: vi.fn(),
          },
        }),
      );
      expect(r.findSlashCommand('/hello world')?.id).toBe('hello');
      expect(r.findSlashCommand('/other')).toBeUndefined();
    });

    it('register replaces previous registration with the same id', () => {
      const r = createFeatureRegistry();
      r.register(newFeature({ id: 'dup', label: 'A' }));
      r.register(newFeature({ id: 'dup', label: 'B' }));
      expect(r.getFeatures()).toHaveLength(1);
      expect(r.getFeatures()[0].label).toBe('B');
    });
  });
});
