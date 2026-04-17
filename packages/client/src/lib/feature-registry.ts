import type { ChannelFeature, MenuItemFeature, SlashCommandFeature } from './feature';
import { isMenuItemFeature, isSlashCommandFeature } from './feature';

export interface FeatureRegistry {
  register(feature: ChannelFeature): void;
  findSlashCommand(message: string): SlashCommandFeature | undefined;
  getSlashCommand(command: string): SlashCommandFeature | undefined;
  getAll(): ChannelFeature[];
  getSlashCommandFeatures(): SlashCommandFeature[];
  getMenuItemFeatures(): MenuItemFeature[];
}

export function createFeatureRegistry(): FeatureRegistry {
  const features: ChannelFeature[] = [];

  return {
    register(feature) {
      const idx = features.findIndex((f) => f.id === feature.id);
      if (idx >= 0) {
        features[idx] = feature;
      } else {
        features.push(feature);
      }
    },

    findSlashCommand(message) {
      return features
        .filter(isSlashCommandFeature)
        .find((f) => (f.match ? f.match(message) : message.trim() === f.command));
    },

    getSlashCommand(command) {
      return features.filter(isSlashCommandFeature).find((f) => f.command === command);
    },

    getAll() {
      return [...features];
    },

    getSlashCommandFeatures() {
      return features.filter(isSlashCommandFeature);
    },

    getMenuItemFeatures() {
      return features.filter(isMenuItemFeature);
    },
  };
}
