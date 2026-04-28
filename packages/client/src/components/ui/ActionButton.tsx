import type { AsyncActionState } from '../../hooks/useAsyncAction';
import { Spinner } from './Spinner';

/** Standard "user-triggered async" button — pairs with `useAsyncAction`.
 *  Shows an inline spinner + disables the button while the wrapped action
 *  is in flight. Default border/hover styling matches GitPane Actions row;
 *  override via `className` for one-off variants. */
export function ActionButton({
  action,
  label,
  className,
}: {
  action: AsyncActionState;
  label: string;
  className?: string;
}): React.JSX.Element {
  return (
    <button
      type="button"
      disabled={action.pending}
      onClick={() => void action.run()}
      className={
        className ??
        'px-2 py-0.5 rounded border border-border text-text-muted hover:text-text hover:bg-white/5 disabled:opacity-50 inline-flex items-center gap-1'
      }
    >
      {action.pending && <Spinner className="w-3 h-3" />}
      {label}
    </button>
  );
}
