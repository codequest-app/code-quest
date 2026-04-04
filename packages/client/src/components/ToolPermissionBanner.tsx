import type { ControlPermissionResponse } from '@code-quest/shared';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useChannelConfig } from '../contexts/channel';
import type { PendingControl } from '../types/chat';

export function ToolPermissionBanner({
  pending,
  onRespond,
}: {
  pending: PendingControl;
  onRespond: (response: ControlPermissionResponse) => void;
}) {
  const { providerConfig } = useChannelConfig();
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [denyMessage, setDenyMessage] = useState('');
  const containerRef = useRef<HTMLFieldSetElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const input = pending.input ?? {};
  const [editedInput, setEditedInput] = useState<Record<string, unknown> | null>(null);
  const updatedInput = editedInput ?? input;

  const toolName = pending.toolName ?? 'Unknown';
  const hasInput = Object.keys(input).length > 0;

  const options = [
    { label: 'Yes', action: () => onRespond({ behavior: 'allow', updatedInput }) },
    ...(pending.permissionSuggestions
      ? [
          {
            label: 'Yes, allow for this session',
            action: () =>
              onRespond({
                behavior: 'allow',
                updatedInput,
                updatedPermissions: pending.permissionSuggestions,
              }),
          },
        ]
      : []),
    {
      label: 'No',
      action: () => {
        const msg = denyMessage.trim() || 'User denied this action';
        onRespond({ behavior: 'deny', message: msg, interrupt: false });
      },
    },
  ];

  const handleKeyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useLayoutEffect(() => {
    handleKeyRef.current = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onRespond({ behavior: 'deny', message: 'User cancelled', interrupt: false });
        return;
      }
      const num = Number(e.key);
      if (num >= 1 && num <= options.length) {
        e.preventDefault();
        options[num - 1].action();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIdx((i) => Math.min(i + 1, options.length));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        if (focusedIdx < options.length) {
          options[focusedIdx].action();
        }
      }
    };
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => handleKeyRef.current(e);
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const circledNumbers = ['①', '②', '③', '④', '⑤'];

  return (
    <fieldset
      ref={containerRef}
      aria-label="Permission request"
      className="relative bg-surface border border-border rounded-lg overflow-hidden mb-1.5 p-2 outline-none focus-within:border-accent/50"
      data-focused-index={focusedIdx}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-bg rounded-lg" />

      {/* Content */}
      <div className="relative z-[1] text-text">
        <div className="font-bold text-sm mb-1">
          Do you want to proceed with <strong>{toolName}</strong>?
        </div>

        {/* Tool-specific content */}
        {toolName === 'Bash' && typeof input.command === 'string' && (
          <div className="mb-1">
            <div
              className="text-xs bg-black/20 rounded p-2 overflow-auto max-h-32 font-mono focus:outline-none focus:ring-1 focus:ring-accent/50"
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              onInput={(e) => {
                const text = (e.target as HTMLDivElement).textContent ?? '';
                setEditedInput({ ...input, command: text });
              }}
            >
              {input.command}
            </div>
            {typeof input.description === 'string' && (
              <p className="text-xs text-text-muted/70 mt-1">{input.description}</p>
            )}
          </div>
        )}

        {/* Collapsible details */}
        {hasInput && (
          <div className="text-xs text-text-muted mb-1.5">
            <details>
              <summary className="cursor-pointer select-none inline-flex items-center gap-1">
                <span>Details</span>
                <svg
                  aria-hidden="true"
                  className="transition-transform [details[open]>&]:rotate-180"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M3 4.5L6 7.5L9 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </summary>
              <pre className="mt-2 p-2 text-xs font-mono bg-black/10 border border-border rounded overflow-auto max-h-48 whitespace-pre-wrap">
                {JSON.stringify(input, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="relative z-[1] flex flex-col gap-2 mt-2">
        {options.map((opt, i) => (
          <button
            key={opt.label}
            type="button"
            onClick={opt.action}
            onMouseEnter={() => setFocusedIdx(i)}
            className={`w-full text-left text-xs px-2 py-1.5 rounded border-0 cursor-pointer font-medium transition-colors ${
              i === focusedIdx
                ? 'bg-accent text-white font-bold'
                : 'bg-transparent text-text shadow-[inset_0_0_0_1px_var(--color-border)]'
            }`}
          >
            <span className="opacity-60 pr-1">{circledNumbers[i]}</span> {opt.label}
          </button>
        ))}

        {/* Reject input */}
        <input
          ref={inputRef}
          type="text"
          placeholder={`Tell ${providerConfig?.brand.name ?? 'Claude'} what to do instead`}
          value={denyMessage}
          onChange={(e) => setDenyMessage(e.target.value)}
          onMouseEnter={() => setFocusedIdx(options.length)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && denyMessage.trim()) {
              e.stopPropagation();
              onRespond({ behavior: 'deny', message: denyMessage.trim(), interrupt: false });
            }
          }}
          className={`w-full text-xs bg-transparent rounded px-2 py-1.5 text-text placeholder:text-text-muted/50 focus:outline-none ${
            focusedIdx === options.length
              ? 'border border-accent/50'
              : 'border border-transparent shadow-[inset_0_0_0_1px_var(--color-border)]'
          }`}
        />
      </div>

      {/* Keyboard hint */}
      <div className="relative z-[1] text-[11px] text-text-muted/50 mt-2">Esc to cancel</div>
    </fieldset>
  );
}
