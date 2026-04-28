import { useRef } from 'react';

/**
 * Hook for cycling through previously sent messages with ArrowUp/Down.
 * Mirrors the extension's useMessageHistory behavior.
 */
export function useInputHistory(): {
  history: string[];
  push: (message: string) => void;
  cycleUp: () => string | null;
  cycleDown: () => string;
  reset: () => void;
} {
  const historyRef = useRef<string[]>([]);
  const indexRef = useRef(-1);

  const push = (message: string): void => {
    const trimmed = message.trim();
    if (!trimmed) return;
    if (historyRef.current[historyRef.current.length - 1] === trimmed) return;
    historyRef.current.push(trimmed);
    indexRef.current = -1;
  };

  const cycleUp = (): string | null => {
    if (historyRef.current.length === 0) return null;
    if (indexRef.current === -1) {
      indexRef.current = historyRef.current.length - 1;
    } else if (indexRef.current > 0) {
      indexRef.current--;
    }
    return historyRef.current[indexRef.current] ?? null;
  };

  const cycleDown = (): string => {
    if (indexRef.current === -1) return '';
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current++;
      return historyRef.current[indexRef.current] ?? '';
    }
    indexRef.current = -1;
    return '';
  };

  const reset = (): void => {
    indexRef.current = -1;
  };

  return {
    history: historyRef.current,
    push: push,
    cycleUp: cycleUp,
    cycleDown: cycleDown,
    reset: reset,
  };
}
