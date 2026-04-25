import { useCallback, useRef, useState } from 'react';

export interface AsyncActionState {
  /** Run the wrapped action. Concurrent calls while already pending are
   *  no-ops (the second click during an in-flight RPC is dropped). */
  run: () => Promise<void>;
  /** True from the moment `run` is invoked until the underlying promise
   *  settles (resolve or reject). Components disable buttons + show a
   *  spinner while pending. */
  pending: boolean;
}

/** Standardize the "user-triggered async with pending UI" pattern.
 *  Wraps an async fn; returns `{ run, pending }`. The wrapper handles
 *  concurrency dedup (in-flight ref) so callers don't have to. */
export function useAsyncAction(fn: () => Promise<unknown>): AsyncActionState {
  const [pending, setPending] = useState(false);
  const inflightRef = useRef(false);

  const run = useCallback(async () => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    setPending(true);
    try {
      await fn();
    } finally {
      inflightRef.current = false;
      setPending(false);
    }
  }, [fn]);

  return { run, pending };
}
