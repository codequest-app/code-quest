import * as Collapsible from '@radix-ui/react-collapsible';
import { useEffect, useRef, useState } from 'react';
import { InlineAction } from '@/components/ui/InlineAction';
import { cn } from '@/utils/cn';

interface ExpandableProps {
  children: React.ReactNode;
  maxHeight?: number;
  defaultOpen?: boolean;
}

export function Expandable({
  children,
  maxHeight = 500,
  defaultOpen = false,
}: ExpandableProps): React.JSX.Element {
  const [open, setOpen] = useState(defaultOpen);
  const [overflow, setOverflow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) return;
    const el = ref.current;
    if (!el) return;
    setOverflow(el.scrollHeight > el.clientHeight);
  });

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <section
        ref={ref}
        aria-label="truncated-inner"
        data-expanded={open ? 'true' : 'false'}
        className={cn(!open && 'relative overflow-hidden')}
        style={open ? undefined : { maxHeight }}
      >
        {children}
        {!open && overflow && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-bg pointer-events-none" />
        )}
      </section>
      {overflow && (
        <Collapsible.Trigger asChild>
          <InlineAction className="underline mt-1">{open ? 'Show less' : 'Show more'}</InlineAction>
        </Collapsible.Trigger>
      )}
    </Collapsible.Root>
  );
}
