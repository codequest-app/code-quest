import { type RefObject, useEffect, useRef, useState } from 'react';
import { useClickOutside } from './useClickOutside';

interface UsePopoverResult<Trigger extends HTMLElement, Panel extends HTMLElement> {
  open: boolean;
  setOpen: (value: boolean | ((v: boolean) => boolean)) => void;
  triggerRef: RefObject<Trigger | null>;
  panelRef: RefObject<Panel | null>;
}

/** Popover plumbing: open state, outside-click close, Escape close. */
export function usePopover<
  Trigger extends HTMLElement = HTMLButtonElement,
  Panel extends HTMLElement = HTMLDivElement,
>(): UsePopoverResult<Trigger, Panel> {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<Trigger>(null);
  const panelRef = useRef<Panel>(null);

  useClickOutside([panelRef, triggerRef], () => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return { open, setOpen, triggerRef, panelRef };
}
