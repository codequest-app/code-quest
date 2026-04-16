import { useEffect, useRef, useState } from 'react';
import { cn } from '../utils/cn';

interface TruncatedContentProps {
  children: React.ReactNode;
  maxHeight?: number;
}

export function TruncatedContent({ children, maxHeight = 500 }: TruncatedContentProps) {
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
      <div
        ref={ref}
        data-testid="truncated-inner"
        className={cn(!expanded && 'relative overflow-hidden')}
        style={expanded ? undefined : { maxHeight }}
      >
        {children}
        {!expanded && overflow && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-bg pointer-events-none" />
        )}
      </div>
      {overflow && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-text-muted hover:text-text underline mt-1 cursor-pointer"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}
