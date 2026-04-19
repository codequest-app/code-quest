import { toMenuItem } from './adapters/to-menu-item';
import { toSlashCommand } from './adapters/to-slash-command';
import type { Feature, MenuItemFeature, SlashCommandFeature } from './feature';

export interface FeatureRegistry {
  register(feature: Feature): void;
  findSlashCommand(message: string): SlashCommandFeature | undefined;
  getSlashCommand(command: string): SlashCommandFeature | undefined;
  /** Primary accessor — returns the raw Feature objects. */
  getFeatures(): Feature[];
  getSlashCommandFeatures(): SlashCommandFeature[];
  getMenuItemFeatures(): MenuItemFeature[];
}

export function createFeatureRegistry(): FeatureRegistry {
  const entries: Feature[] = [];
  const slashCache = new WeakMap<Feature, SlashCommandFeature | null>();
  const slashOf = (f: Feature): SlashCommandFeature | null => {
    const cached = slashCache.get(f);
    if (cached !== undefined) return cached;
    const slash = toSlashCommand(f) ?? null;
    slashCache.set(f, slash);
    return slash;
  };

  return {
    register(feature) {
      const idx = entries.findIndex((f) => f.id === feature.id);
      if (idx >= 0) entries[idx] = feature;
      else entries.push(feature);
    },

    findSlashCommand(message) {
      for (const f of entries) {
        const slash = slashOf(f);
        if (!slash) continue;
        if (slash.match ? slash.match(message) : message.trim() === slash.command) return slash;
      }
      return undefined;
    },

    getSlashCommand(command) {
      for (const f of entries) {
        const slash = slashOf(f);
        if (slash?.command === command) return slash;
      }
      return undefined;
    },

    getSlashCommandFeatures() {
      const out: SlashCommandFeature[] = [];
      for (const f of entries) {
        const slash = slashOf(f);
        if (slash) out.push(slash);
      }
      return out;
    },

    getMenuItemFeatures() {
      return entries.map(toMenuItem);
    },

    getFeatures() {
      return [...entries];
    },
  };
}
