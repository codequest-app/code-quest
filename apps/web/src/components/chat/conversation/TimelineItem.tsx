import { cn } from '@/utils/cn';

export type RowPosition = 'first' | 'last' | 'middle' | 'only';

const LINE_CLASS: Record<RowPosition, string> = {
  only: 'hidden',
  first: 'top-4 bottom-0',
  last: 'top-0 h-4',
  middle: 'top-0 bottom-0',
};

interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  position: RowPosition;
  dotClass: string;
  showDot?: boolean;
  py?: string;
  children: React.ReactNode;
}

export function TimelineItem({
  position,
  dotClass,
  showDot = true,
  py = 'py-1.5',
  children,
  ...divProps
}: TimelineItemProps): React.JSX.Element {
  return (
    <div {...divProps} className={cn('relative pl-7 leading-5', py)}>
      {showDot && (
        <span
          data-testid="timeline-dot"
          className={cn('absolute left-2 top-3 w-2 h-2 rounded-full z-sticky', dotClass)}
        />
      )}
      <span
        data-testid="timeline-line"
        aria-hidden={position === 'only' ? 'true' : undefined}
        className={cn('absolute left-3 w-px bg-border', LINE_CLASS[position])}
      />
      {children}
    </div>
  );
}
