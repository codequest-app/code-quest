import * as Collapsible from '@radix-ui/react-collapsible';
import { useEffect, useRef, useState } from 'react';
import { InlineAction } from '@/components/ui/InlineAction';
import { cn } from '@/utils/cn';

interface TruncatedContentProps {
  children: React.ReactNode;
  maxHeight?: number;
}

export function TruncatedContent({
  children,
  maxHeight = 500,
}: TruncatedContentProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
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
