import type { Feature } from './feature.ts';

export interface FeatureRegistry {
  register(feature: Feature): void;
  /** Returns the Feature whose slash binding matches `message`, or undefined. */
  findSlashCommand(message: string): Feature | undefined;
  /** Returns the Feature whose slash.command equals `command`, or undefined. */
  getSlashCommand(command: string): Feature | undefined;
  /** Primary accessor — returns the raw Feature objects. */
  getFeatures(): Feature[];
}

export function createFeatureRegistry(): FeatureRegistry {
  const entries: Feature[] = [];
  const findFeatureWithSlash = (
    predicate: (slash: NonNullable<Feature['slash']>) => boolean,
  ): Feature | undefined => {
    for (const f of entries) {
      if (f.slash && predicate(f.slash)) return f;
    }
    return undefined;
  };

  return {
    register(feature) {
      const idx = entries.findIndex((f) => f.id === feature.id);
      if (idx >= 0) entries[idx] = feature;
      else entries.push(feature);
    },

    findSlashCommand(message) {
      return findFeatureWithSlash((slash) =>
        slash.match ? slash.match(message) : message.trim() === slash.command,
      );
    },

    getSlashCommand(command) {
      return findFeatureWithSlash((slash) => slash.command === command);
    },

    getFeatures() {
      return [...entries];
    },
  };
}
