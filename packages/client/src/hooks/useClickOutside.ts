import { type RefObject, useEffect, useRef } from 'react';

/**
 * Calls `onClickOutside` when a mousedown occurs outside all given refs.
 * Automatically subscribes/unsubscribes based on `enabled`.
 */
export function useClickOutside(
  refs: RefObject<HTMLElement | null>[],
  onClickOutside: () => void,
  enabled = true,
): void {
  const refsRef = useRef(refs);
  const callbackRef = useRef(onClickOutside);
  refsRef.current = refs;
  callbackRef.current = onClickOutside;

  useEffect(() => {
    if (!enabled) return;
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (refsRef.current.every((ref) => !ref.current?.contains(target))) {
        callbackRef.current();
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [enabled]);
}
