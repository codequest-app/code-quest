import { useCallback, useRef, useState } from 'react';
import { Button } from './Button';
import { Spinner } from './Spinner';

async function runExclusive(
  inflightRef: React.RefObject<boolean>,
  setPending: (v: boolean) => void,
  fn: () => unknown,
): Promise<void> {
  if (inflightRef.current) return;
  inflightRef.current = true;
  setPending(true);
  try {
    await fn();
  } catch (e) {
    console.error(e);
  } finally {
    inflightRef.current = false;
    setPending(false);
  }
}

export function ActionButton({
  onClick,
  children,
  ...buttonProps
}: {
  onClick: () => unknown;
} & Omit<React.ComponentProps<typeof Button>, 'onClick' | 'disabled'>): React.JSX.Element {
  const [pending, setPending] = useState(false);
  const inflightRef = useRef(false);

  const run = useCallback(() => runExclusive(inflightRef, setPending, onClick), [onClick]);

  return (
    <Button disabled={pending} onClick={() => void run()} {...buttonProps}>
      {pending && <Spinner className="w-3 h-3" />}
      {children}
    </Button>
  );
}
