import { useEffect } from 'react';
import { MarkdownContent } from './MarkdownContent';

interface SideQuestionDialogProps {
  open: boolean;
  question: string;
  answer: string | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

export function SideQuestionDialog({
  open,
  question,
  answer,
  loading,
  error,
  onClose,
}: SideQuestionDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop — covers ChatPanel only; Escape is primary dismiss */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: backdrop dismiss is supplementary; Escape handled at document level */}
      <div
        role="presentation"
        className="absolute inset-0 z-30 bg-black/40 flex items-start justify-center px-4"
        onClick={onClose}
      >
        {/* Panel — stop propagation so clicks inside don't close */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation only; keyboard handled at document level */}
        <div
          role="dialog"
          aria-label="/btw"
          aria-modal="true"
          className="mt-[15vh] max-w-[600px] w-full bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 pt-4 pb-2 border-b border-border">
            <p className="text-xs text-text-muted font-mono truncate">/btw {question}</p>
          </div>
          <div className="px-4 py-3 max-h-[55vh] overflow-y-auto text-sm">
            {loading && <p className="text-text-muted">Thinking…</p>}
            {!loading && error && <p className="text-danger">{error}</p>}
            {!loading && answer !== null && <MarkdownContent content={answer} />}
          </div>
        </div>
      </div>
    </>
  );
}
