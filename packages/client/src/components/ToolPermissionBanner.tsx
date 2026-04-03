import type { ControlPermissionResponse } from '@code-quest/shared';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useChannelConfig } from '../contexts/channel';
import type { PendingControl } from '../types/chat';
import { OptionButton } from './OptionButton';
import { PermissionHeader } from './PermissionHeader';

export function ToolPermissionBanner({
  pending,
  onRespond,
}: {
  pending: PendingControl;
  onRespond: (response: ControlPermissionResponse) => void;
}) {
  const { providerConfig } = useChannelConfig();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [denyMessage, setDenyMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const input = pending.input ?? {};
  const [editedInput, setEditedInput] = useState<Record<string, unknown> | null>(null);
  const updatedInput = editedInput ?? input;

  const toolPath = input.file_path ?? input.command ?? pending.toolName ?? '';
  const shortPath =
    String(toolPath).length > 30 ? `${String(toolPath).slice(0, 30)}…` : String(toolPath);

  const options = [
    { label: 'Yes', action: () => onRespond({ behavior: 'allow', updatedInput }) },
    ...(pending.permissionSuggestions
      ? [
          {
            label: `Yes, allow //${shortPath} for this session`,
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
        const msg = denyMessage.trim() || 'User cancelled';
        onRespond({ behavior: 'deny', message: msg, interrupt: false });
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
        setSelectedIdx((i) => Math.min(i + 1, options.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        options[selectedIdx].action();
      }
    };
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => handleKeyRef.current(e);
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
      <div className="px-4 pt-3 pb-2">
        <PermissionHeader
          toolName={pending.toolName}
          input={input}
          onInputChange={setEditedInput}
        />
      </div>

      <div className="flex flex-col">
        {options.map((opt, i) => (
          <OptionButton
            key={opt.label}
            index={i + 1}
            label={opt.label}
            selected={i === selectedIdx}
            onClick={opt.action}
            onMouseEnter={() => setSelectedIdx(i)}
          />
        ))}
      </div>

      <div className="px-4 py-2 border-t border-border/50">
        <input
          ref={inputRef}
          type="text"
          placeholder={`Tell ${providerConfig?.brand.name ?? 'Claude'} what to do instead`}
          value={denyMessage}
          onChange={(e) => setDenyMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && denyMessage.trim()) {
              e.stopPropagation();
              onRespond({ behavior: 'deny', message: denyMessage.trim(), interrupt: false });
            }
          }}
          className="w-full text-xs bg-transparent border border-border/50 rounded px-2 py-1.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent/50"
        />
      </div>

      <div className="px-4 py-1.5 text-[10px] text-text-muted/50">Esc to cancel</div>
    </div>
  );
}
