import { useEffect, useRef, useState } from 'react';

export interface CommitComposerProps {
  onCommit: (message: string) => void;
  /** Number of changed files — surfaced in the submit button label
   *  (e.g. "Commit 3"). Omit to use the plain "Commit" label. */
  count?: number;
}

export function CommitComposer({ onCommit, count }: CommitComposerProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(true);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const subjectRef = useRef<HTMLInputElement>(null);
  // Focus on mount + every time the composer re-expands. A `ref` callback
  // would re-fire on every parent re-render and steal focus mid-typing.
  useEffect(() => {
    if (expanded) subjectRef.current?.focus();
  }, [expanded]);

  if (!expanded) {
    return (
      <button
        type="button"
        className="mt-3 w-full px-2 py-1 text-left text-xs text-text-muted border border-dashed border-border rounded hover:text-text hover:border-accent"
        onClick={() => setExpanded(true)}
      >
        + Commit message…
      </button>
    );
  }

  function submit() {
    const message = body ? `${subject.trim()}\n\n${body.trim()}` : subject.trim();
    if (!message) return;
    onCommit(message);
    setSubject('');
    setBody('');
    setExpanded(false);
  }

  return (
    <section
      className="mt-3 flex flex-col gap-1 p-2 border border-border rounded bg-bg/40"
      aria-label="commit-composer"
    >
      <input
        ref={subjectRef}
        type="text"
        value={subject}
        placeholder="Subject"
        onChange={(e) => setSubject(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
          if (e.key === 'Escape') setExpanded(false);
        }}
        className="px-2 py-1 rounded border border-border bg-surface text-xs font-mono"
      />
      <textarea
        value={body}
        placeholder="Body (optional)"
        rows={3}
        onChange={(e) => setBody(e.target.value)}
        className="px-2 py-1 rounded border border-border bg-surface text-xs font-mono resize-none"
      />
      <div className="flex justify-end gap-2 mt-1">
        <button
          type="button"
          className="text-xs text-text-muted hover:text-text px-2 py-0.5"
          onClick={() => {
            setExpanded(false);
            setSubject('');
            setBody('');
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!subject.trim()}
          className="text-xs px-3 py-0.5 rounded bg-accent text-white hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={submit}
        >
          {count !== undefined && count > 0 ? `Commit ${count}` : 'Commit'}
        </button>
      </div>
    </section>
  );
}
