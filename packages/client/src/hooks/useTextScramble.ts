import { useEffect, useRef, useState } from 'react';

const SCRAMBLE_FRAME_MS = 40;

function randomFrom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function scrambleChar(target: string, stage: number): string {
  if (target === ' ') return ' ';
  switch (stage) {
    case 3:
      return target;
    case 2:
    case 1:
      return randomFrom(['.', '_', target]);
    case 0:
      return '▌';
    default:
      return target;
  }
}

function padToLength(text: string, len: number): string {
  return text.length >= len ? text : text + ' '.repeat(len - text.length);
}

function replaceCharAt(str: string, index: number, char: string): string {
  if (index < 0 || index >= str.length) return str;
  return str.slice(0, index) + char + str.slice(index + 1);
}

/**
 * Animate text reveal character by character with scramble effect.
 * First render shows text immediately. Subsequent target changes trigger animation.
 */
export function useTextScramble(targetText: string, maxLen: number): string {
  const paddedTarget = padToLength(targetText, maxLen);
  const [display, setDisplay] = useState(paddedTarget);
  const isFirstRef = useRef(true);
  const stateRef = useRef({ index: 0, target: paddedTarget });

  useEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false;
      setDisplay(padToLength(targetText, maxLen));
      return;
    }

    stateRef.current.index = 0;
    stateRef.current.target = padToLength(targetText, maxLen);
    let lastTime = 0;
    let rafId: number | null = null;

    const tick = (time: number) => {
      if (time - lastTime < SCRAMBLE_FRAME_MS) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      lastTime = time;

      const pos = stateRef.current.index;
      if (pos - 3 >= stateRef.current.target.length) {
        rafId = null;
        return;
      }

      stateRef.current.index++;
      setDisplay((prev) => {
        let next = prev;
        for (let offset = 0; offset <= 3; offset++) {
          const charIdx = pos - offset;
          if (charIdx >= 0 && charIdx < stateRef.current.target.length) {
            next = replaceCharAt(
              next,
              charIdx,
              scrambleChar(stateRef.current.target[charIdx], offset),
            );
          }
        }
        return next;
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [targetText, maxLen]);

  return display;
}
