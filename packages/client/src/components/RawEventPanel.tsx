import { useEffect, useState } from 'react';
import { isRecord } from '../utils/is-record';
import { JsonViewer } from './JsonViewer';

const ICON_BTN = 'text-text-muted hover:text-text text-sm';

function getEventType(evt: unknown): string | undefined {
  if (!isRecord(evt)) return undefined;
  return typeof evt.type === 'string' ? evt.type : undefined;
}

interface RawEventPanelProps {
  onFetch?: () => Promise<{ events: unknown[] }>;
  onSubscribe?: (cb: (evt: unknown) => void) => () => void;
  onClose: () => void;
}

export function RawEventPanel({ onFetch, onSubscribe, onClose }: RawEventPanelProps) {
  const [events, setEvents] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [searchText, setSearchText] = useState('');

  // Streaming: subscribe to real-time events
  useEffect(() => {
    if (!onSubscribe) return;
    const unsubscribe = onSubscribe((evt) => {
      setEvents((prev) => [...prev, evt]);
    });
    return unsubscribe;
  }, [onSubscribe]);

  const handleRefresh = async () => {
    if (!onFetch) return;
    setLoading(true);
    try {
      const result = await onFetch();
      setEvents(result.events);
    } finally {
      setLoading(false);
    }
  };

  const uniqueTypes = (() => {
    const types = new Set<string>();
    for (const evt of events) {
      const t = getEventType(evt);
      if (t) types.add(t);
    }
    return Array.from(types).sort();
  })();

  const search = searchText.toLowerCase();
  const filteredEvents = events
    .filter((evt) => !filterType || getEventType(evt) === filterType)
    .filter((evt) => !search || JSON.stringify(evt).toLowerCase().includes(search));

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium text-text">Raw Events</span>
        <div className="flex gap-2">
          {onFetch && (
            <button type="button" title="Refresh" onClick={handleRefresh} className={ICON_BTN}>
              ↻
            </button>
          )}
          {events.length > 0 && (
            <button type="button" title="Clear" onClick={() => setEvents([])} className={ICON_BTN}>
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm bg-surface border border-border rounded px-2 py-1 text-text"
          >
            <option value="">All types</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t}>
                {t}
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
      <div className="flex-1 overflow-y-auto">
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
      </div>
    </div>
  );
}
