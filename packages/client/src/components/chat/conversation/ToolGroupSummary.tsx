import { cn } from '@/utils/cn';
import type { GroupChip } from '@/utils/tool-utils';
import { RotatableChevron } from '../tool-use/message-blocks/primitives.tsx';

interface ToolGroupSummaryProps {
  chips: GroupChip[];
  expanded: boolean;
  onToggle: () => void;
}

export function ToolGroupSummary({
  chips,
  expanded,
  onToggle,
}: ToolGroupSummaryProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-1.5 pl-7 py-1.5 text-xs text-text-muted hover:text-text cursor-pointer select-none transition-colors w-full text-left"
    >
      {expanded ? (
        <RotatableChevron open className="opacity-50 shrink-0" />
      ) : (
        <span className="w-2 h-2 rounded-full bg-text-muted/40 shrink-0" />
      )}
      <span className="flex items-center gap-1 flex-wrap">
        {chips.map((chip) => (
          <span
            key={chip.label}
            className={cn(
              'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-medium',
              chip.isError ? 'bg-danger/15 text-danger' : 'bg-white/8 text-text-muted',
            )}
          >
            {chip.label}
            {chip.count !== undefined && chip.count > 1 && (
              <span className="opacity-60">×{chip.count}</span>
            )}
          </span>
        ))}
      </span>
      {!expanded && <RotatableChevron className="opacity-40 shrink-0 ml-auto" />}
    </button>
  );
}
