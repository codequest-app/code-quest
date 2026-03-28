import type { ControlPermissionResponse } from '@code-quest/shared';
import type { PendingControl } from '../types/chat';
import { OptionButton } from './OptionButton';

export function HookCallbackBanner({
  pending,
  onRespond,
}: {
  pending: PendingControl;
  onRespond: (response: ControlPermissionResponse) => void;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg shadow-lg px-4 py-3">
      <p className="text-sm font-semibold mb-2">{pending.toolName ?? pending.subtype}</p>
      <div className="flex gap-2">
        <OptionButton
          index={1}
          label="Continue"
          selected
          onClick={() => onRespond({ continue: true })}
        />
        <OptionButton index={2} label="Cancel" onClick={() => onRespond({ continue: false })} />
      </div>
    </div>
  );
}
