import { useCallback, useRef, useState } from 'react';
import { Spinner } from './Spinner';

export async function runExclusive(
  inflightRef: React.RefObject<boolean>,
  setPending: (v: boolean) => void,
  fn: () => Promise<unknown>,
): Promise<void> {
  if (inflightRef.current) return;
  inflightRef.current = true;
  setPending(true);
  try {
    await fn();
  } finally {
    inflightRef.current = false;
    setPending(false);
  }
}

export function ActionButton({
  onClick,
  label,
  className,
}: {
  onClick: () => Promise<unknown>;
  label: string;
  className?: string;
}): React.JSX.Element {
  const [pending, setPending] = useState(false);
  const inflightRef = useRef(false);

  const run = useCallback(() => runExclusive(inflightRef, setPending, onClick), [onClick]);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void run()}
      className={
        className ??
        'px-2 py-0.5 rounded border border-border text-text-muted hover:text-text hover:bg-white/5 disabled:opacity-50 inline-flex items-center gap-1'
      }
    >
      {pending && <Spinner className="w-3 h-3" />}
      {label}
    </button>
  );
}
