import * as RadixDialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export const Dialog = RadixDialog.Root;
export const DialogClose = RadixDialog.Close;

interface DialogContentProps {
  children: ReactNode;
  className?: string;
  /** When true, prevents closing on overlay click and Escape */
  mandatory?: boolean;
  title: string;
  hideTitle?: boolean;
}

export function DialogContent({
  children,
  className = '',
  mandatory = false,
  title,
  hideTitle = false,
}: DialogContentProps) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-bg/60" />
      <RadixDialog.Content
        className={cn(
          'fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface text-text border border-border rounded-lg shadow-xl p-4 max-h-[calc(100vh-64px)] overflow-y-auto outline-none',
          className,
        )}
        onEscapeKeyDown={mandatory ? (e) => e.preventDefault() : undefined}
        onPointerDownOutside={mandatory ? (e) => e.preventDefault() : undefined}
        onInteractOutside={mandatory ? (e) => e.preventDefault() : undefined}
        aria-describedby={undefined}
      >
        <RadixDialog.Title
          className={
            hideTitle
              ? 'sr-only'
              : 'text-sm font-semibold text-text pb-2 mb-3 border-b border-border'
          }
        >
          {title}
        </RadixDialog.Title>
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
