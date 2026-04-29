import type { ControlPermissionResponse, PendingControl } from '@code-quest/shared';
import { useChannelControl } from '../../../contexts/channel';
import { PlanReviewBanner } from '../plan-review/PlanReviewBanner';
import { HookCallbackCard } from './HookCallbackCard';
import { ToolPermissionCard } from './ToolPermissionCard';

export function PendingActionButtons(): React.ReactNode {
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
    return <HookCallbackCard pending={pending} onRespond={onRespond} />;
  }

  return <ToolPermissionCard pending={pending} onRespond={onRespond} />;
}
