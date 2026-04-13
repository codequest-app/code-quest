import type { SessionSummary } from '@code-quest/shared';
import { useEffect, useState } from 'react';
import { useResume } from '../contexts/ResumeContext';
import { useSession } from '../contexts/SessionContext';

interface ResumePickerProps {
  cwd?: string;
  onResume: (channelId: string) => void;
  onCancel: () => void;
}

export function ResumePicker({ cwd, onResume, onCancel }: ResumePickerProps) {
  const { listSessions } = useSession();
  const { resume } = useResume();
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickingId, setPickingId] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: listSessions is stable from session actions
  useEffect(() => {
    let cancelled = false;
    listSessions({ cwd, limit: 50, excludeLive: true })
      .then((res) => {
        if (!cancelled) setSessions(res.sessions);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [cwd]);

  async function handleClick(row: SessionSummary) {
    setPickingId(row.id);
    setError(null);
    try {
      const { channelId } = await resume(row.id);
      onResume(channelId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPickingId(null);
    }
  }

  if (sessions === null && !error) {
    return <div className="p-4 text-sm text-text-muted">Loading…</div>;
  }

  if (sessions && sessions.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center gap-3">
        <div className="text-sm text-text-muted">
          {cwd ? 'No resumable sessions for this project.' : 'No resumable sessions.'}
        </div>
        <button
          type="button"
          className="px-3 py-1 text-sm rounded border border-border hover:bg-white/5"
          onClick={onCancel}
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {error && <div className="px-4 py-2 text-sm text-red-400">{error}</div>}
      <ul className="flex flex-col">
        {sessions?.map((row) => {
          const label = row.title ?? row.firstUserMessage ?? row.id;
          const preview = row.lastAssistantMessage;
          const loading = pickingId === row.id;
          return (
            <li key={row.id}>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleClick(row)}
                className="w-full text-left px-3 py-2 hover:bg-white/5 disabled:opacity-50"
              >
                <div className="text-sm text-text">{label}</div>
                {preview && <div className="text-xs text-text-muted truncate">{preview}</div>}
                <div className="text-xs text-text-muted">{row.createdAt}</div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
