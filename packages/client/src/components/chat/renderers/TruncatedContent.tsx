import { useEffect, useRef, useState } from 'react';
import { cn } from '../../../utils/cn';
import { InlineAction } from '../../ui/InlineAction';

interface TruncatedContentProps {
  children: React.ReactNode;
  maxHeight?: number;
}

export function TruncatedContent({
  children,
  maxHeight = 500,
}: TruncatedContentProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setOverflow(el.scrollHeight > el.clientHeight);
  });

  return (
    <div>
      <section
        ref={ref}
        aria-label="truncated-inner"
        className={cn(!expanded && 'relative overflow-hidden')}
        style={expanded ? undefined : { maxHeight }}
      >
        {children}
        {!expanded && overflow && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-bg pointer-events-none" />
        )}
      </section>
      {overflow && (
        <InlineAction className="underline mt-1" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show less' : 'Show more'}
        </InlineAction>
      )}
    </div>
  );
}
