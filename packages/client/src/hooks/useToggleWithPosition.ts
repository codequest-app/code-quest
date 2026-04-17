import { type RefObject, useState } from 'react';

type Position = 'above' | 'below';

/** Minimum pixels above the anchor needed to open the popover upward */
const MIN_SPACE_ABOVE = 320;

export function useToggleWithPosition(anchorRef: RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position>('above');

  const toggle = () => {
    setOpen((prev) => {
      if (!prev && anchorRef.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        setPosition(rect.top < MIN_SPACE_ABOVE ? 'below' : 'above');
      }
      return !prev;
    });
  };

  const close = () => setOpen(false);

  return { open, toggle, close, position };
}
