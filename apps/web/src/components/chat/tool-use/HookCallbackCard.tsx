import type { ControlPermissionResponse, PendingControl } from '@code-quest/shared';
import { OptionButton } from './OptionButton.tsx';

export function HookCallbackCard({
  pending,
  onRespond,
}: {
  pending: PendingControl;
  onRespond: (response: ControlPermissionResponse) => void;
}): React.JSX.Element {
  return (
    <div className="bg-surface border border-border rounded-lg shadow-floating px-4 py-3">
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
