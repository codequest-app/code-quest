import { useCallback, useEffect, useRef, useState } from 'react';

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
    }, 120);
    return () => clearInterval(id);
  }, []);

  // Change verb on schedule: 2s, 3s, 5s, then every 5s
  const scheduleNextVerb = useCallback(() => {
    const delays = [2000, 3000, 5000];
    const count = verbTimerRef.current;
    const delay = count < delays.length ? delays[count] : 5000;
    verbTimerRef.current++;
    return delay;
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setVerb(randomVerb(verbs));
      timer = setTimeout(tick, scheduleNextVerb());
    };
    timer = setTimeout(tick, scheduleNextVerb());
    return () => clearTimeout(timer);
  }, [verbs, scheduleNextVerb]);

  const displayText = statusText ?? verb;

  return (
    <div className="relative z-[3] flex items-center gap-1.5 h-[1.85em] mt-1 px-4">
      <span data-testid="spinner-icon" className="text-accent text-sm">
        {ICON_CYCLE[iconIndex]}
      </span>
      <span data-testid="spinner-verb" className="text-xs text-text-muted">
        {displayText}...
      </span>
    </div>
  );
}
