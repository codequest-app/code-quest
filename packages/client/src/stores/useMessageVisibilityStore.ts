import { create, type Mutate, type StoreApi, type UseBoundStore } from 'zustand';
import { persist } from 'zustand/middleware';
import { localStoragePersist } from './persistStorage.ts';

interface MessageVisibilityState {
  enabledTypes: string[] | null;
  setEnabledTypes: (types: string[]) => void;
}

export const useMessageVisibilityStore: UseBoundStore<
  Mutate<StoreApi<MessageVisibilityState>, [['zustand/persist', unknown]]>
> = create<MessageVisibilityState>()(
  persist(
    (set) => ({
      enabledTypes: null,
      setEnabledTypes: (types) => set({ enabledTypes: types }),
    }),
    { name: 'code-quest:message-visibility', storage: localStoragePersist() },
  ),
);
