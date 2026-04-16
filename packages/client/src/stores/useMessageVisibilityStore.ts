import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MessageVisibilityState {
  enabledTypes: string[] | null;
  setEnabledTypes: (types: string[]) => void;
}

export const useMessageVisibilityStore = create<MessageVisibilityState>()(
  persist(
    (set) => ({
      enabledTypes: null,
      setEnabledTypes: (types) => set({ enabledTypes: types }),
    }),
    { name: 'code-quest:message-visibility' },
  ),
);
