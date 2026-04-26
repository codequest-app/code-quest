import { useEffect, useState } from 'react';

interface TaskLine {
  lineIndex: number;
  indent: string;
  checked: boolean;
  text: string;
}

/** Matches `  - [ ] some text` / `- [x] done` lines. Group 1 = indent, 2 = mark, 3 = text. */
const TASK_RE = /^(\s*)-\s+\[( |x|X)\]\s*(.*)$/;

/** Non-task lines: section headings, plain text, blank lines. Rendered as read-only. */
type Line = TaskLine | { lineIndex: number; kind: 'raw'; text: string };

export interface TaskChecklistProps {
  content: string;
  /** Called when the user clicks a checkbox; should run the `toggleTask` RPC
   *  and return `{ ok, checked }` or `{ error }`. */
  onToggle: (lineIndex: number) => Promise<{ ok: true; checked: boolean } | { error: string }>;
  /** Surfaced via the caller's toast on write failure. */
  onError?: (message: string) => void;
}

function parseLines(content: string): Line[] {
  return content.split('\n').map((raw, lineIndex) => {
    const match = raw.match(TASK_RE);
    if (!match) return { lineIndex, kind: 'raw', text: raw };
    const [, indent, mark, text] = match;
    return { lineIndex, indent, checked: mark.toLowerCase() === 'x', text };
  });
}

function isTaskLine(line: Line): line is TaskLine {
  return !('kind' in line);
}

export function TaskChecklist({ content, onToggle, onError }: TaskChecklistProps) {
  const [lines, setLines] = useState<Line[]>(() => parseLines(content));

  // Keep local state in sync when parent content changes (after refetch).
  useEffect(() => {
    setLines(parseLines(content));
  }, [content]);

  async function toggle(lineIndex: number) {
    // Optimistic flip
    let prevChecked = false;
    setLines((prev) =>
      prev.map((l) => {
        if (l.lineIndex !== lineIndex || !isTaskLine(l)) return l;
        prevChecked = l.checked;
        return { ...l, checked: !l.checked };
      }),
    );
    const result = await onToggle(lineIndex);
    if ('error' in result) {
      // Revert
      setLines((prev) =>
        prev.map((l) =>
          l.lineIndex !== lineIndex || !isTaskLine(l) ? l : { ...l, checked: prevChecked },
        ),
      );
      onError?.(result.error);
    }
  }

  return (
    <div className="font-mono text-xs whitespace-pre-wrap leading-relaxed">
      {lines.map((line) => {
        if (!isTaskLine(line)) {
          return (
            <div key={line.lineIndex} className="text-text-muted">
              {line.text || ' '}
            </div>
          );
        }
        return (
          <label
            key={line.lineIndex}
            aria-label={`task-line-${line.lineIndex}`}
            className="flex items-start gap-2 py-0.5 cursor-pointer hover:bg-white/5 rounded"
          >
            <span aria-hidden className="whitespace-pre">
              {line.indent}
            </span>
            <input
              type="checkbox"
              checked={line.checked}
              onChange={() => void toggle(line.lineIndex)}
              className="mt-0.5"
            />
            <span className={line.checked ? 'text-text-dim line-through' : 'text-text'}>
              {line.text}
            </span>
          </label>
        );
      })}
    </div>
  );
}
