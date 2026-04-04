import type { ControlPermissionResponse, PendingControl } from '@code-quest/shared';
import { useChannelControl } from '../contexts/channel';
import { HookCallbackBanner } from './HookCallbackBanner';
import { PlanReviewBanner } from './PlanReviewBanner';
import { ToolPermissionBanner } from './ToolPermissionBanner';

export function PendingActionBanner() {
  const { pendingControls, respondToControl: onRespond } = useChannelControl();
  if (pendingControls.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {pendingControls.map((item) => (
        <PendingActionItem
          key={item.requestId}
          pending={item}
          onRespond={(response) => onRespond(response, item.requestId)}
        />
      ))}
    </div>
  );
}

function PendingActionItem({
  pending,
  onRespond,
}: {
  pending: PendingControl;
  onRespond: (response: ControlPermissionResponse) => void;
}) {
  if (pending.toolName === 'ExitPlanMode') {
    return <PlanReviewBanner pending={pending} onRespond={onRespond} />;
  }

  if (pending.subtype === 'hook_callback') {
    return <HookCallbackBanner pending={pending} onRespond={onRespond} />;
  }

  return <ToolPermissionBanner pending={pending} onRespond={onRespond} />;
}
