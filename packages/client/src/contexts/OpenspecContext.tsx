import {
  EVENTS,
  type OpenspecArchiveResult,
  type OpenspecChangeNewResult,
  type OpenspecListResult,
  type OpenspecToggleTaskResult,
  openspecArchiveResultSchema,
  openspecChangeNewResultSchema,
  openspecDirtyEventSchema,
  openspecListResultSchema,
  openspecToggleTaskResultSchema,
} from '@code-quest/shared';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { rpc } from '../socket/rpc';
import { createQueryCache } from '../utils/query-cache';
import { useSocket } from './SocketContext';

interface OpenspecActions {
  /** Synchronous snapshot — `undefined` if not yet fetched. */
  getOpenspecList: (cwd: string) => OpenspecListResult | undefined;
  /** Notify on cache change for `cwd`. Parameterless callback — consumer
   *  reads new value via `getOpenspecList(cwd)`. First subscribe per cwd
   *  triggers initial fetch. */
  subscribeOpenspecListChange: (cwd: string, onChange: () => void) => () => void;
  /** Force a refetch. */
  refetchOpenspecList: (cwd: string) => Promise<void>;
  /** Spawn `openspec new change <name>` server-side. */
  changeNew: (cwd: string, name: string) => Promise<OpenspecChangeNewResult>;
  /** Spawn `openspec archive <name> -y [--skip-specs]` server-side. */
  archive: (
    cwd: string,
    name: string,
    opts?: { skipSpecs?: boolean },
  ) => Promise<OpenspecArchiveResult>;
  /** Toggle a task checkbox in tasks.md at `lineIndex`. */
  toggleTask: (cwd: string, name: string, lineIndex: number) => Promise<OpenspecToggleTaskResult>;
}

const OpenspecActionsContext = createContext<OpenspecActions | null>(null);

export function useOpenspecActions(): OpenspecActions {
  const ctx = useContext(OpenspecActionsContext);
  if (!ctx) throw new Error('useOpenspecActions must be used within OpenspecProvider');
  return ctx;
}

/** External-store adapter for openspec list — see GitContext.useGitStatus. */
export function useOpenspecList(cwd: string): OpenspecListResult | undefined {
  const { getOpenspecList, subscribeOpenspecListChange } = useOpenspecActions();
  const subscribe = useCallback(
    (cb: () => void) => subscribeOpenspecListChange(cwd, cb),
    [cwd, subscribeOpenspecListChange],
  );
  const getSnapshot = useCallback(() => getOpenspecList(cwd), [cwd, getOpenspecList]);
  return useSyncExternalStore(subscribe, getSnapshot);
}

const fetchOpenspecList =
  (socket: ReturnType<typeof useSocket>['socket']) =>
  async (cwd: string): Promise<OpenspecListResult> => {
    const response = await rpc(socket, EVENTS.openspec.list, { cwd });
    const parsed = openspecListResultSchema.safeParse(response);
    return parsed.success ? parsed.data : { error: 'Invalid response' };
  };

const extractOpenspecCwd = (payload: unknown): string | null => {
  const parsed = openspecDirtyEventSchema.safeParse(payload);
  return parsed.success ? parsed.data.cwd : null;
};

export function OpenspecProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { socket } = useSocket();
  const [store] = useState(() =>
    createQueryCache<OpenspecListResult>({
      fetch: fetchOpenspecList(socket),
      idPrefix: 'openspec-sub',
    }),
  );

  useEffect(() => {
    store.setFetch(fetchOpenspecList(socket));
  }, [socket, store]);

  useEffect(() => {
    if (!socket) return;
    const onDirty = (payload: unknown) => {
      const cwd = extractOpenspecCwd(payload);
      if (cwd) void store.refetchIfSubscribed(cwd);
    };
    socket.on(EVENTS.openspec.dirty, onDirty);
    return () => {
      socket.off(EVENTS.openspec.dirty, onDirty);
    };
  }, [socket, store]);

  const actions = useMemo<OpenspecActions>(
    () => ({
      getOpenspecList: store.get,
      subscribeOpenspecListChange: store.subscribe,
      refetchOpenspecList: store.refetch,
      async changeNew(cwd, name) {
        const response = await rpc(socket, EVENTS.openspec.changeNew, { cwd, name });
        const parsed = openspecChangeNewResultSchema.safeParse(response);
        return parsed.success ? parsed.data : { error: 'Invalid response' };
      },
      async archive(cwd, name, opts) {
        const response = await rpc(socket, EVENTS.openspec.archive, {
          cwd,
          name,
          skipSpecs: opts?.skipSpecs,
        });
        const parsed = openspecArchiveResultSchema.safeParse(response);
        return parsed.success ? parsed.data : { error: 'Invalid response' };
      },
      async toggleTask(cwd, name, lineIndex) {
        const response = await rpc(socket, EVENTS.openspec.toggleTask, {
          cwd,
          name,
          lineIndex,
        });
        const parsed = openspecToggleTaskResultSchema.safeParse(response);
        return parsed.success ? parsed.data : { error: 'Invalid response' };
      },
    }),
    [store, socket],
  );

  return (
    <OpenspecActionsContext.Provider value={actions}>{children}</OpenspecActionsContext.Provider>
  );
}
