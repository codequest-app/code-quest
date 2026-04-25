import { useEffect } from 'react';
import { useFsActions } from '../contexts/FsContext';

/** Keep the server-side chokidar watcher for `cwd` alive while this component
 *  is mounted, by holding a no-op subscription. Pane that doesn't itself
 *  consume `files:dirty` (because a sibling pane / context owns the refetch)
 *  still needs to keep the refcount > 0 so the watcher isn't torn down when
 *  the consuming pane temporarily unmounts. */
export function useKeepFsWatcherAlive(cwd: string): void {
  const { subscribeFsDirty } = useFsActions();
  useEffect(() => subscribeFsDirty(cwd, () => {}), [cwd, subscribeFsDirty]);
}
