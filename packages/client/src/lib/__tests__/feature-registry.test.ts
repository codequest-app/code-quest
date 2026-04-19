import { describe, expect, it, vi } from 'vitest';
import type { Feature } from '../feature';
import { createFeatureRegistry } from '../feature-registry';

const mk = (over: Partial<Feature> = {}): Feature => ({
  id: 'f',
  label: 'F',
  section: 'Customize',
  execute: vi.fn(),
  ...over,
});

describe('feature-registry', () => {
  describe('register + getFeatures / getAll', () => {
    it('stores registered features in insertion order', () => {
      const r = createFeatureRegistry();
      r.register(mk({ id: 'a' }));
      r.register(mk({ id: 'b' }));
      expect(r.getFeatures().map((f) => f.id)).toEqual(['a', 'b']);
    });

    it('replaces an existing registration with the same id', () => {
      const r = createFeatureRegistry();
      r.register(mk({ id: 'dup', label: 'A' }));
      r.register(mk({ id: 'dup', label: 'B' }));
      expect(r.getFeatures()).toHaveLength(1);
      expect(r.getFeatures()[0].label).toBe('B');
    });
  });

  describe('getMenuItemFeatures', () => {
    it('adapts every Feature to MenuItemFeature', () => {
      const r = createFeatureRegistry();
      r.register(mk({ id: 'a', label: 'A', section: 'Settings' }));
      const items = r.getMenuItemFeatures();
      expect(items).toHaveLength(1);
      expect(items[0].menuItem.label).toBe('A');
      expect(items[0].menuItem.section).toBe('Settings');
    });
  });

  describe('findSlashCommand', () => {
    it('finds by exact command when no match provided', () => {
      const r = createFeatureRegistry();
      const f = mk({
        id: 'reload-plugins',
        slash: { command: '/reload-plugins', invoke: vi.fn() },
      });
      r.register(f);
      expect(r.findSlashCommand('/reload-plugins')?.id).toBe('reload-plugins');
    });

    it('returns undefined when no feature matches', () => {
      const r = createFeatureRegistry();
      expect(r.findSlashCommand('/unknown')).toBeUndefined();
    });

    it('uses custom match when defined', () => {
      const r = createFeatureRegistry();
      r.register(
        mk({
          id: 'compact',
          slash: {
            command: '/compact',
            match: (msg) => msg.trim().startsWith('/compact'),
            invoke: vi.fn(),
          },
        }),
      );
      expect(r.findSlashCommand('/compact 50')?.id).toBe('compact');
      expect(r.findSlashCommand('/compact')?.id).toBe('compact');
      expect(r.findSlashCommand('/other')).toBeUndefined();
    });

    it('does not match a feature without slash binding', () => {
      const r = createFeatureRegistry();
      r.register(mk({ id: 'rewind', label: 'Rewind', section: 'Context' }));
      expect(r.findSlashCommand('/rewind')).toBeUndefined();
    });
  });

  describe('getSlashCommand / getSlashCommandFeatures', () => {
    it('returns features with a slash binding', () => {
      const r = createFeatureRegistry();
      const slashFn = vi.fn();
      r.register(mk({ id: 'a', slash: { command: '/a', invoke: slashFn } }));
      r.register(mk({ id: 'b' })); // no slash
      expect(r.getSlashCommand('/a')?.id).toBe('a');
      expect(r.getSlashCommandFeatures().map((f) => f.id)).toEqual(['a']);
    });

    it('returns undefined for unknown command', () => {
      const r = createFeatureRegistry();
      expect(r.getSlashCommand('/unknown')).toBeUndefined();
    });
  });

  describe('hybrid feature (slash + menu on one Feature)', () => {
    it('appears in both getSlashCommandFeatures and getMenuItemFeatures', () => {
      const r = createFeatureRegistry();
      r.register(
        mk({
          id: 'usage',
          label: 'Account & usage…',
          section: 'Model',
          slash: { command: '/usage', invoke: vi.fn() },
        }),
      );
      expect(r.getSlashCommandFeatures()).toHaveLength(1);
      expect(r.getMenuItemFeatures()).toHaveLength(1);
    });
  });
});
