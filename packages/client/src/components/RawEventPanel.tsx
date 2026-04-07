import { useEffect, useRef, useState } from 'react';
import { isRecord } from '../utils/is-record';
import { JsonViewer } from './JsonViewer';

const ICON_BTN = 'text-text-muted hover:text-text text-sm';

function getEventType(evt: unknown): string | undefined {
  if (!isRecord(evt)) return undefined;
  return typeof evt.type === 'string' ? evt.type : undefined;
}

function isDeltaType(type: string): boolean {
  return type.toLowerCase().includes('delta');
}

interface RawEventPanelProps {
  onFetch?: () => Promise<{ events: unknown[] }>;
  onSubscribe?: (cb: (evt: unknown) => void) => () => void;
  onClose: () => void;
}

export function RawEventPanel({ onFetch, onSubscribe, onClose }: RawEventPanelProps) {
  const [events, setEvents] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(() => new Set());
  const [searchText, setSearchText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const seenTypesRef = useRef<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  function trackNewTypes(evts: unknown[]) {
    const newHidden = new Set<string>();
    for (const evt of evts) {
      const t = getEventType(evt);
      if (t && !seenTypesRef.current.has(t)) {
        seenTypesRef.current.add(t);
        if (isDeltaType(t)) newHidden.add(t);
      }
    }
    if (newHidden.size > 0) {
      setHiddenTypes((prev) => {
        const next = new Set(prev);
        for (const t of newHidden) next.add(t);
        return next;
      });
    }
  }

  // Streaming: subscribe to real-time events
  const autoScrollRef = useRef(autoScroll);
  autoScrollRef.current = autoScroll;

  // biome-ignore lint/correctness/useExhaustiveDependencies: trackNewTypes stable via React Compiler
  useEffect(() => {
    if (!onSubscribe) return;
    const unsubscribe = onSubscribe((evt) => {
      trackNewTypes([evt]);
      setEvents((prev) => [...prev, evt]);
      queueMicrotask(() => {
        if (autoScrollRef.current) bottomRef.current?.scrollIntoView({ behavior: 'instant' });
      });
    });
    return unsubscribe;
  }, [onSubscribe]);

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
    if (!atBottom && !userScrolledRef.current) {
      userScrolledRef.current = true;
      setAutoScroll(false);
    } else if (atBottom) {
      userScrolledRef.current = false;
    }
  }

  const handleRefresh = async () => {
    if (!onFetch) return;
    setLoading(true);
    try {
      const result = await onFetch();
      seenTypesRef.current = new Set();
      trackNewTypes(result.events);
      setEvents(result.events);
    } finally {
      setLoading(false);
    }
  };

  // Compute type counts
  const typeCounts = new Map<string, number>();
  for (const evt of events) {
    const t = getEventType(evt);
    if (t) typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
  }
  const sortedTypes = Array.from(typeCounts.keys()).sort();

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selected = new Set(Array.from(e.target.selectedOptions, (o) => o.value));
    const nextHidden = new Set<string>();
    for (const t of sortedTypes) {
      if (!selected.has(t)) nextHidden.add(t);
    }
    setHiddenTypes(nextHidden);
  }

  const search = searchText.toLowerCase();
  const filteredEvents = events
    .filter((evt) => {
      const t = getEventType(evt);
      return !t || !hiddenTypes.has(t);
    })
    .filter((evt) => !search || JSON.stringify(evt).toLowerCase().includes(search));

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium text-text">Raw Events</span>
        <div className="flex gap-2">
          {onSubscribe && (
            <button
              type="button"
              title="Auto-scroll"
              onClick={() => {
                setAutoScroll(true);
                userScrolledRef.current = false;
                bottomRef.current?.scrollIntoView({ behavior: 'instant' });
              }}
              className={`${ICON_BTN} ${autoScroll ? 'text-accent' : ''}`}
            >
              ⤓
            </button>
          )}
          {onFetch && (
            <button type="button" title="Refresh" onClick={handleRefresh} className={ICON_BTN}>
              ↻
            </button>
          )}
          {events.length > 0 && (
            <button
              type="button"
              title="Clear"
              onClick={() => {
                setEvents([]);
                seenTypesRef.current = new Set();
                setHiddenTypes(new Set());
              }}
              className={ICON_BTN}
            >
              ⌀
            </button>
          )}
          <button type="button" title="Close" onClick={onClose} className={ICON_BTN}>
            ✕
          </button>
        </div>
      </div>
      {events.length > 0 && (
        <div className="flex gap-2 px-4 py-2 border-b border-border">
          <select
            multiple
            data-testid="type-filter"
            value={sortedTypes.filter((t) => !hiddenTypes.has(t))}
            onChange={handleSelectChange}
            className="text-xs bg-surface border border-border rounded px-1 py-1 text-text min-w-[140px]"
            size={Math.min(sortedTypes.length, 6)}
          >
            {sortedTypes.map((t) => (
              <option key={t} value={t}>
                {t} ({typeCounts.get(t)})
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="text-sm bg-surface border border-border rounded px-2 py-1 text-text flex-1"
          />
        </div>
      )}
      <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
        {loading && <div className="px-4 py-8 text-center text-text-muted text-sm">Loading...</div>}
        {!loading && events.length === 0 && (
          <div className="px-4 py-8 text-center text-text-muted text-sm">
            {onSubscribe ? 'Waiting for events…' : 'No events. Click ↻ to fetch.'}
          </div>
        )}
        {filteredEvents.map((evt, i) => {
          const evtType = getEventType(evt);
          return (
            <details key={`${i}-${evtType ?? 'unknown'}`} className="border-b border-border">
              <summary className="px-4 py-2 cursor-pointer text-xs text-text-muted hover:text-text">
                Event #{i + 1}
                {evtType ? ` — ${evtType}` : ''}
              </summary>
              <div className="px-4 py-2 text-[11px] overflow-x-auto">
                <JsonViewer data={evt} />
              </div>
            </details>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
