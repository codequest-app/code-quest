import { create, type StoreApi, type UseBoundStore } from 'zustand';

interface BlockOpenStore {
  openIds: Set<string>;
  seenIds: Set<string>;
  setOpen: (id: string, open: boolean) => void;
  initOpen: (id: string) => void;
  reset: () => void;
}

function applyOpen(
  s: Pick<BlockOpenStore, 'openIds' | 'seenIds'>,
  id: string,
  open: boolean,
): Pick<BlockOpenStore, 'openIds' | 'seenIds'> {
  const alreadyOpen = s.openIds.has(id);
  const alreadySeen = s.seenIds.has(id);
  if (open === alreadyOpen && alreadySeen) return s;
  const nextOpen = new Set(s.openIds);
  const nextSeen = new Set(s.seenIds);
  if (open) nextOpen.add(id);
  else nextOpen.delete(id);
  nextSeen.add(id);
  return { openIds: nextOpen, seenIds: nextSeen };
}

export const useBlockOpenStore: UseBoundStore<StoreApi<BlockOpenStore>> = create<BlockOpenStore>(
  (set, get) => ({
    openIds: new Set(),
    seenIds: new Set(),
    setOpen: (id, open) => set((s) => applyOpen(s, id, open)),
    initOpen: (id) => {
      if (!get().seenIds.has(id)) set((s) => applyOpen(s, id, true));
    },
    reset: () => set({ openIds: new Set(), seenIds: new Set() }),
  }),
);
