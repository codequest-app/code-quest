import { useEffect, useRef, useState } from 'react';
import { useTextScramble } from '../hooks/useTextScramble';

const ICON_CYCLE_MS = 120;
const VERB_DELAYS = [2000, 3000, 5000] as const;
const VERB_DELAY_DEFAULT = 5000;

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

function randomVerb(verbs: string[]): string {
  return verbs[Math.floor(Math.random() * verbs.length)];
}

interface SpinnerVerbProps {
  statusText?: string | null;
  verbs?: string[];
}

export function SpinnerVerb({ statusText, verbs = DEFAULT_VERBS }: SpinnerVerbProps) {
  const [iconIndex, setIconIndex] = useState(0);
  const [verb, setVerb] = useState(() => randomVerb(verbs));
  const verbTimerRef = useRef(0);

  // Cycle icon every 120ms
  useEffect(() => {
    const id = setInterval(() => {
      setIconIndex((i) => (i + 1) % ICON_CYCLE.length);
    }, ICON_CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  // Change verb on schedule: 2s, 3s, 5s, then every 5s
  const scheduleNextVerb = () => {
    const count = verbTimerRef.current;
    const delay = count < VERB_DELAYS.length ? VERB_DELAYS[count] : VERB_DELAY_DEFAULT;
    verbTimerRef.current++;
    return delay;
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: scheduleNextVerb stable via React Compiler
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setVerb(randomVerb(verbs));
      timer = setTimeout(tick, scheduleNextVerb());
    };
    timer = setTimeout(tick, scheduleNextVerb());
    return () => clearTimeout(timer);
  }, [verbs]);

  const displayText = statusText ?? verb;
  const maxLen = Math.max(...verbs.map((v) => v.length)) + 3; // +3 for "..."
  const scrambled = useTextScramble(`${displayText}...`, maxLen);

  return (
    <div className="relative z-[3] inline-flex items-center gap-1 h-[1.85em] mt-1 px-4">
      <span
        data-testid="spinner-icon"
        className="text-accent text-[1.5em] inline-block w-[1.5em] text-center font-mono"
      >
        {ICON_CYCLE[iconIndex]}
      </span>
      <span
        data-testid="spinner-verb"
        className="text-xs text-text font-medium font-mono whitespace-pre"
      >
        {scrambled}
      </span>
    </div>
  );
}
