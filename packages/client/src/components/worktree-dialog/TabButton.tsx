import { cn } from '../../utils/cn';

/** Tab header used inside CreateWorktreeDialog (Checkout existing / Create new branch). */
export function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-xs -mb-px border-b-2',
        active ? 'border-accent text-text' : 'border-transparent text-text-muted hover:text-text',
      )}
    >
      {children}
    </button>
  );
}
