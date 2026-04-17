export interface OpenSignal {
  isOpen: boolean;
  subscribe(cb: () => void): () => void;
  setOpen(open: boolean): void;
}

export function createOpenSignal(): OpenSignal {
  let isOpen = false;
  const subscribers = new Set<() => void>();

  return {
    get isOpen() {
      return isOpen;
    },
    subscribe(cb) {
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    },
    setOpen(open) {
      if (isOpen === open) return;
      isOpen = open;
      for (const cb of subscribers) cb();
    },
  };
}
