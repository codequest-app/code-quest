import { describe, expect, it } from 'vitest';
import type { MenuItemFeature, SlashCommandFeature } from '../feature';
import { createFeatureRegistry } from '../feature-registry';

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
});
