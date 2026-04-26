import { cn } from '../../utils/cn';

/** Simple CSS spinner — currentColor border, transparent top for the spin
 *  effect. Inherits text color from parent. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="spinner"
      className={cn(
        'inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin',
        className,
      )}
    />
  );
}
