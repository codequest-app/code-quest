import { useRef } from 'react';

/**
 * Hook for cycling through previously sent messages with ArrowUp/Down.
 * Mirrors the extension's useMessageHistory behavior.
 */
export function useInputHistory() {
  const historyRef = useRef<string[]>([]);
  const indexRef = useRef(-1);

  const push = (message: string) => {
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
    return historyRef.current[indexRef.current];
  };

  const cycleDown = (): string => {
    if (indexRef.current === -1) return '';
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current++;
      return historyRef.current[indexRef.current];
    }
    indexRef.current = -1;
    return '';
  };

  const reset = () => {
    indexRef.current = -1;
  };

  return { history: historyRef.current, push, cycleUp, cycleDown, reset };
}
