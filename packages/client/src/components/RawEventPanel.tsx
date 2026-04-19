import { isRecord } from '@code-quest/shared';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../utils/cn';
import { JsonViewer } from './JsonViewer';
import { RawEventFilterBar } from './RawEventFilterBar';
import { SearchBar } from './SearchBar';

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
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const seenTypesRef = useRef<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  function trackNewTypes(evts: unknown[]) {
    const toAdd: string[] = [];
    for (const evt of evts) {
      const t = getEventType(evt);
      if (t && !seenTypesRef.current.has(t)) {
        seenTypesRef.current.add(t);
        toAdd.push(t);
      }
    }
    if (toAdd.length > 0) {
      setVisibleTypes((prev) => {
        const next = new Set(prev);
        for (const t of toAdd) {
          if (!isDeltaType(t)) next.add(t);
        }
        return next;
      });
    }
  }

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
      setVisibleTypes(new Set());
      trackNewTypes(result.events);
      setEvents(result.events);
    } finally {
      setLoading(false);
    }
  };

  // Compute type counts sorted by count desc
  const typeCounts = new Map<string, number>();
  for (const evt of events) {
    const t = getEventType(evt);
    if (t) typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
  }
  const filterEntries = Array.from(typeCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const search = searchText.toLowerCase();
  const filteredEvents = events
    .filter((evt) => {
      const t = getEventType(evt);
      return !t || visibleTypes.has(t);
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
              className={cn(ICON_BTN, autoScroll && 'text-accent')}
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
                setVisibleTypes(new Set());
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
      <SearchBar
        searchQuery={searchText}
        setSearchQuery={setSearchText}
        placeholder="Search events..."
      />
      {filterEntries.length > 0 && (
        <RawEventFilterBar
          entries={filterEntries}
          selected={visibleTypes}
          onChange={setVisibleTypes}
        />
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
