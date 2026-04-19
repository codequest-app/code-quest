import { toMenuItem } from './adapters/to-menu-item';
import { toSlashCommand } from './adapters/to-slash-command';
import type { Feature, MenuItemView, SlashCommandView } from './feature';

export interface FeatureRegistry {
  register(feature: Feature): void;
  findSlashCommand(message: string): SlashCommandView | undefined;
  getSlashCommand(command: string): SlashCommandView | undefined;
  /** Primary accessor — returns the raw Feature objects. */
  getFeatures(): Feature[];
  getSlashCommandViews(): SlashCommandView[];
  getMenuItemViews(): MenuItemView[];
}

export function createFeatureRegistry(): FeatureRegistry {
  const entries: Feature[] = [];
  const slashCache = new WeakMap<Feature, SlashCommandView | null>();
  const slashOf = (f: Feature): SlashCommandView | null => {
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

    getSlashCommandViews() {
      const out: SlashCommandView[] = [];
      for (const f of entries) {
        const slash = slashOf(f);
        if (slash) out.push(slash);
      }
      return out;
    },

    getMenuItemViews() {
      return entries.map(toMenuItem);
    },

    getFeatures() {
      return [...entries];
    },
  };
}
