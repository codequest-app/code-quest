import { createContext, useContext } from 'react';
import { createFeatureRegistry, type FeatureRegistry } from '../../lib/feature-registry';

const FeatureRegistryContext = createContext<FeatureRegistry>(createFeatureRegistry());

export function useFeatureRegistry(): FeatureRegistry {
  return useContext(FeatureRegistryContext);
}

export { FeatureRegistryContext };
