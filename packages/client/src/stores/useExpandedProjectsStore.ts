import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { localStoragePersist } from './persistStorage';

interface ExpandedProjectsState {
  /** Array of project cwds currently expanded in the sidebar tree. Array
   *  rather than Set so zustand's persist middleware can round-trip through
   *  JSON without custom serialization. */
  expanded: string[];
  isExpanded: (cwd: string) => boolean;
  toggle: (cwd: string) => void;
  setExpanded: (cwd: string, expanded: boolean) => void;
}

export const useExpandedProjectsStore = create<ExpandedProjectsState>()(
  persist(
    (set, get) => ({
      expanded: [],
      isExpanded: (cwd) => get().expanded.includes(cwd),
      toggle: (cwd) =>
        set((state) => ({
          expanded: state.expanded.includes(cwd)
            ? state.expanded.filter((x) => x !== cwd)
            : [...state.expanded, cwd],
        })),
      setExpanded: (cwd, expanded) =>
        set((state) => {
          const has = state.expanded.includes(cwd);
          if (expanded === has) return state;
          return {
            expanded: expanded ? [...state.expanded, cwd] : state.expanded.filter((x) => x !== cwd),
          };
        }),
    }),
    {
      name: 'cc-office.expandedProjects',
      storage: localStoragePersist(),
      // Only persist the array, not the method references.
      partialize: (state) => ({ expanded: state.expanded }),
    },
  ),
);
