import { createContext, useContext } from 'react';
import type { FeatureRegistry } from '../../lib/feature-registry';

const FeatureRegistryContext: React.Context<FeatureRegistry | null> =
  createContext<FeatureRegistry | null>(null);

export function useFeatureRegistry(): FeatureRegistry {
  const registry = useContext(FeatureRegistryContext);
  if (!registry) {
    throw new Error('useFeatureRegistry must be used within a ChannelMessagesProvider');
  }
  return registry;
}

export { FeatureRegistryContext };
