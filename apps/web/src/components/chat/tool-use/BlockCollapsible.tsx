import { useLayoutEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBlockOpenStore } from '@/stores/useBlockOpenStore.ts';
import { CollapsibleBlock } from '../renderers/primitives.tsx';

type BlockCollapsibleProps = {
  blockId: string;
  initialOpen?: boolean;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  label?: string;
  children?: React.ReactNode;
};

export function BlockCollapsible({
  blockId,
  initialOpen,
  header,
  icon,
  label,
  children,
}: BlockCollapsibleProps): React.JSX.Element {
  useLayoutEffect(() => {
    if (initialOpen) {
      useBlockOpenStore.getState().initOpen(blockId);
    }
  }, [blockId, initialOpen]);

  const { open, setOpen } = useBlockOpenStore(
    useShallow((s) => ({ open: s.openIds.has(blockId), setOpen: s.setOpen })),
  );

  return (
    <CollapsibleBlock
      open={open}
      onOpenChange={(next) => setOpen(blockId, next)}
      header={header}
      icon={icon}
      label={label}
    >
      {children}
    </CollapsibleBlock>
  );
}
