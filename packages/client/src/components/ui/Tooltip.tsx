import * as RadixTooltip from '@radix-ui/react-tooltip';

export const TooltipProvider: typeof RadixTooltip.Provider = RadixTooltip.Provider;

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: RadixTooltip.TooltipContentProps['side'];
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps): React.JSX.Element {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={4}
          className="z-50 rounded bg-surface-raised px-2 py-1 text-xs text-text shadow-md animate-in fade-in-0 zoom-in-95"
        >
          {content}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
