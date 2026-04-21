import { useEffect, useRef } from 'react';

const ICON_CYCLE_MS = 120;
const SCRAMBLE_FRAME_MS = 40;
const VERB_DELAYS = [2000, 3000, 5000] as const;
const VERB_DELAY_DEFAULT = 5000;
const VERB_SUFFIX = '...';

const ICONS = ['·', '✢', '*', '✶', '✻', '✽'];
const ICON_CYCLE = [...ICONS, ...[...ICONS].reverse()];

const DEFAULT_VERBS = [
  'Accomplishing',
  'Baking',
  'Brewing',
  'Calculating',
  'Channelling',
  'Churning',
  'Clauding',
  'Cogitating',
  'Computing',
  'Concocting',
  'Contemplating',
  'Cooking',
  'Crafting',
  'Creating',
  'Crunching',
  'Deliberating',
  'Doing',
  'Enchanting',
  'Envisioning',
  'Forging',
  'Generating',
  'Hatching',
  'Ideating',
  'Imagining',
  'Inferring',
  'Manifesting',
  'Mulling',
  'Musing',
  'Noodling',
  'Percolating',
  'Pondering',
  'Processing',
  'Puzzling',
  'Ruminating',
  'Scheming',
  'Simmering',
  'Spinning',
  'Synthesizing',
  'Thinking',
  'Tinkering',
  'Vibing',
  'Wandering',
  'Whirring',
  'Working',
  'Wrangling',
];

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function padToLength(text: string, len: number): string {
  return text.length >= len ? text : text + ' '.repeat(len - text.length);
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

function replaceCharAt(str: string, index: number, char: string): string {
  if (index < 0 || index >= str.length) return str;
  return str.slice(0, index) + char + str.slice(index + 1);
}

/** Animate `padded` into `el.textContent` one column at a time. Returns cancel fn. */
function runScramble(el: HTMLElement, padded: string): () => void {
  let index = 0;
  let current = padded;
  let lastTime = 0;
  let raf: number | null = null;

  const tick = (time: number) => {
    if (time - lastTime < SCRAMBLE_FRAME_MS) {
      raf = requestAnimationFrame(tick);
      return;
    }
    lastTime = time;
    if (index - 3 >= padded.length) {
      el.textContent = padded;
      raf = null;
      return;
    }
    for (let offset = 0; offset <= 3; offset++) {
      const charIdx = index - offset;
      if (charIdx >= 0 && charIdx < padded.length) {
        current = replaceCharAt(current, charIdx, scrambleChar(padded[charIdx], offset));
      }
    }
    el.textContent = current;
    index++;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return () => {
    if (raf !== null) cancelAnimationFrame(raf);
  };
}

interface SpinnerVerbProps {
  statusText?: string | null;
  verbs?: string[];
}

// All animation writes go to DOM refs directly so React never re-renders on tick.
export function SpinnerVerb({ statusText, verbs = DEFAULT_VERBS }: SpinnerVerbProps) {
  const iconRef = useRef<HTMLSpanElement | null>(null);
  const verbRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % ICON_CYCLE.length;
      if (iconRef.current) iconRef.current.textContent = ICON_CYCLE[i];
    }, ICON_CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = verbRef.current;
    if (!el) return;
    const maxLen = Math.max(...verbs.map((v) => v.length)) + VERB_SUFFIX.length;
    const makeTarget = (text: string) => padToLength(`${text}${VERB_SUFFIX}`, maxLen);

    el.textContent = makeTarget(statusText ?? randomFrom(verbs));

    let cancelScramble: (() => void) | null = null;
    const scramble = (padded: string) => {
      cancelScramble?.();
      cancelScramble = runScramble(el, padded);
    };

    // When statusText is provided, no verb cycling — caller controls the text.
    if (statusText) return () => cancelScramble?.();

    let verbCount = 0;
    let verbTimer: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      const delay = verbCount < VERB_DELAYS.length ? VERB_DELAYS[verbCount] : VERB_DELAY_DEFAULT;
      verbCount++;
      verbTimer = setTimeout(() => {
        scramble(makeTarget(randomFrom(verbs)));
        scheduleNext();
      }, delay);
    };
    scheduleNext();

    return () => {
      clearTimeout(verbTimer);
      cancelScramble?.();
    };
  }, [statusText, verbs]);

  return (
    <div className="relative z-raised inline-flex items-center gap-1 h-[1.85em] mt-1 px-4">
      <span
        ref={iconRef}
        data-testid="spinner-icon"
        className="text-accent text-[1.5em] inline-block w-[1.5em] text-center font-mono"
      >
        {ICON_CYCLE[0]}
      </span>
      <span
        ref={verbRef}
        data-testid="spinner-verb"
        className="text-xs text-text font-medium font-mono whitespace-pre"
      />
    </div>
  );
}
