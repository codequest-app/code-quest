import { useState } from 'react';

const STORAGE_KEY = 'cc-office:recent-cwds';
const MAX_RECENTS = 10;

export interface RecentCwd {
  path: string;
  lastUsed: number;
}

function load(): RecentCwd[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function save(recents: RecentCwd[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recents));
}

export function useRecentCwds() {
  const [recents, setRecents] = useState<RecentCwd[]>(load);

  function addRecent(path: string) {
    setRecents((prev) => {
      const filtered = prev.filter((r) => r.path !== path);
      const updated = [{ path, lastUsed: Date.now() }, ...filtered].slice(0, MAX_RECENTS);
      save(updated);
      return updated;
    });
  }

  return { recents, addRecent };
}
