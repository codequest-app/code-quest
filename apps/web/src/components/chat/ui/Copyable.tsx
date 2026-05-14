import { CopyButton, HOVER_COPY_BASE } from '@/components/ui/CopyButton.tsx';

interface CopyableProps {
  text?: string;
  getText?: () => string;
  children?: React.ReactNode;
  'aria-label'?: string;
}

export function Copyable({
  text,
  getText,
  children,
  'aria-label': ariaLabel,
}: CopyableProps): React.JSX.Element {
  if (!children) {
    return (
      <CopyButton
        text={text}
        getText={getText}
        aria-label={ariaLabel}
        className={`${HOVER_COPY_BASE} absolute top-1 right-1 group-hover:opacity-100`}
      />
    );
  }

  return (
    <div className="relative group/copyable">
      {children}
      <CopyButton
        text={text}
        getText={getText}
        aria-label={ariaLabel}
        className={`${HOVER_COPY_BASE} absolute top-1 right-1 group-hover/copyable:opacity-100`}
      />
    </div>
  );
}
