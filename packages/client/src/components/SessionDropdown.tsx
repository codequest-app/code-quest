import type { RpcResult, SessionSummary } from '@code-quest/shared';
import { useEffect, useRef } from 'react';
import { SessionHistory } from './SessionHistory';

interface SessionDropdownProps {
  sessions: SessionSummary[];
  loading?: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
  onRename?: (id: string, title: string) => Promise<RpcResult<Record<string, never>>>;
  onDelete?: (id: string) => Promise<RpcResult<Record<string, never>>>;
}

export function SessionDropdown({
  sessions,
  loading,
  onSelect,
  onClose,
  onRename,
  onDelete,
}: SessionDropdownProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      <div
        role="none"
        data-testid="session-dropdown-overlay"
        className="fixed inset-0 z-[999]"
        onMouseDown={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div
        ref={panelRef}
        data-testid="session-dropdown-panel"
        className="fixed z-[1000] right-4 top-12 bg-[var(--color-surface,#1e1e1e)] border border-border rounded-xl flex flex-col shadow-lg overflow-hidden"
        style={{
          width: 'min(400px, calc(100vw - 32px))',
          maxHeight: 'min(500px, 50vh)',
        }}
      >
        <SessionHistory
          sessions={sessions}
          loading={loading}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
        />
      </div>
    </>
  );
}
