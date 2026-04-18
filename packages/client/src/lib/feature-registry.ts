import { toMenuItem } from './adapters/to-menu-item';
import { toSlashCommand } from './adapters/to-slash-command';
import type { ChannelFeature, Feature, MenuItemFeature, SlashCommandFeature } from './feature';
import { isFeature, isMenuItemFeature, isSlashCommandFeature } from './feature';

export interface FeatureRegistry {
  register(feature: ChannelFeature | Feature): void;
  findSlashCommand(message: string): SlashCommandFeature | undefined;
  getSlashCommand(command: string): SlashCommandFeature | undefined;
  getAll(): Array<ChannelFeature | Feature>;
  getSlashCommandFeatures(): SlashCommandFeature[];
  getMenuItemFeatures(): MenuItemFeature[];
  /** New-shape accessor — returns raw Feature objects that were registered as Feature. */
  getFeatures(): Feature[];
}

export function createFeatureRegistry(): FeatureRegistry {
  const entries: Array<ChannelFeature | Feature> = [];

  function adaptedSlashCommands(): SlashCommandFeature[] {
    const result: SlashCommandFeature[] = [];
    for (const entry of entries) {
      if (isFeature(entry)) {
        const slash = toSlashCommand(entry);
        if (slash) result.push(slash);
      } else if (isSlashCommandFeature(entry)) {
        result.push(entry);
      }
    }
    return result;
  }

  function adaptedMenuItems(): MenuItemFeature[] {
    const result: MenuItemFeature[] = [];
    for (const entry of entries) {
      if (isFeature(entry)) {
        result.push(toMenuItem(entry));
      } else if (isMenuItemFeature(entry)) {
        result.push(entry);
      }
    }
    return result;
  }

  return {
    register(feature) {
      const idx = entries.findIndex((f) => f.id === feature.id);
      if (idx >= 0) {
        entries[idx] = feature;
      } else {
        entries.push(feature);
      }
    },

    findSlashCommand(message) {
      return adaptedSlashCommands().find((f) =>
        f.match ? f.match(message) : message.trim() === f.command,
      );
    },

    getSlashCommand(command) {
      return adaptedSlashCommands().find((f) => f.command === command);
    },

    getAll() {
      return [...entries];
    },

    getSlashCommandFeatures() {
      return adaptedSlashCommands();
    },

    getMenuItemFeatures() {
      return adaptedMenuItems();
    },

    getFeatures() {
      return entries.filter(isFeature);
    },
  };
}
