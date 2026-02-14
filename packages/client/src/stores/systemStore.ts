import type { SystemCapabilities } from '@code-quest/shared';
import { create } from 'zustand';

interface SystemStore {
  capabilities: SystemCapabilities | null;
  worktreeToastShown: boolean;
  setCapabilities: (caps: SystemCapabilities) => void;
  markWorktreeToastShown: () => void;
}

export const useSystemStore = create<SystemStore>((set) => ({
  capabilities: null,
  worktreeToastShown: false,
  setCapabilities: (capabilities) => set({ capabilities }),
  markWorktreeToastShown: () => set({ worktreeToastShown: true }),
}));
