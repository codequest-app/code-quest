import type { PlanCommentData } from '@code-quest/shared';
import { flip, shift, useFloating } from '@floating-ui/react';
import { useEffect, useRef, useState } from 'react';

interface PlanCommentOverlayProps {
  containerRef: React.RefObject<HTMLElement | null>;
  onAddComment: (comment: PlanCommentData) => void;
}

const MAX_QUOTE_LENGTH = 50;

export function PlanCommentOverlay({ containerRef, onAddComment }: PlanCommentOverlayProps) {
  const [selection, setSelection] = useState<{ text: string } | null>(null);
  const [commentText, setCommentText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const rangeRef = useRef<Range | null>(null);

  const { refs, floatingStyles } = useFloating({
    open: !!selection,
    placement: 'bottom-start',
    middleware: [flip(), shift()],
  });

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !containerRef.current) {
      setSelection(null);
      return;
    }

    const text = sel.toString().trim();
    if (!text) {
      setSelection(null);
      return;
    }

    const range = sel.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      setSelection(null);
      return;
    }

    rangeRef.current = range;
    refs.setReference({
      getBoundingClientRect: () => range.getBoundingClientRect(),
    });
    setSelection({ text });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: handleMouseUp stable via React Compiler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('mouseup', handleMouseUp);
    return () => container.removeEventListener('mouseup', handleMouseUp);
  }, [containerRef]); // handleMouseUp stable via React Compiler

  useEffect(() => {
    if (selection) {
      inputRef.current?.focus();
    }
  }, [selection]);

  const resetForm = () => {
    setCommentText('');
    setSelection(null);
  };

  const handleSubmit = () => {
    if (!selection || !commentText.trim()) return;
    onAddComment({
      id: crypto.randomUUID(),
      comment: commentText.trim(),
      selectedText: selection.text,
      sectionHeading: '',
    });
    resetForm();
    window.getSelection()?.removeAllRanges();
  };

  if (!selection) return null;

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="z-50 bg-bg-secondary border border-border rounded-lg shadow-xl p-2 w-64"
    >
      <div className="text-xs text-text-muted mb-1 truncate" title={selection.text}>
        &ldquo;
        {selection.text.length > MAX_QUOTE_LENGTH
          ? `${selection.text.slice(0, MAX_QUOTE_LENGTH)}...`
          : selection.text}
        &rdquo;
      </div>
      <textarea
        ref={inputRef}
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        placeholder="Add comment..."
        rows={2}
        className="w-full text-sm bg-black/20 rounded px-2 py-1 text-text border border-white/10 resize-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
          if (e.key === 'Escape') resetForm();
        }}
      />
      <div className="flex justify-end gap-1 mt-1">
        <button
          type="button"
          onClick={resetForm}
          className="px-2 py-0.5 text-xs text-text-muted hover:text-text cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!commentText.trim()}
          className="px-2 py-0.5 text-xs bg-accent text-white rounded cursor-pointer disabled:opacity-30"
        >
          Comment
        </button>
      </div>
    </div>
  );
}
