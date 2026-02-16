import type { BattleLogEntry } from '@code-quest/shared';
import { useRef } from 'react';

interface BattleLogProps {
  entries: BattleLogEntry[];
}

export function BattleLog({ entries }: BattleLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom after render when entries change
  const lastCount = useRef(0);
  if (entries.length !== lastCount.current) {
    lastCount.current = entries.length;
    queueMicrotask(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }

  return (
    <div className="battle-log" data-testid="battle-log" ref={scrollRef}>
      {entries.map((entry) => (
        <div key={entry.id} className={`battle-log-entry log-${entry.type}`}>
          {entry.message}
        </div>
      ))}
    </div>
  );
}
