import { useLayoutEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBlockOpenStore } from '@/stores/useBlockOpenStore.ts';
import { CollapsibleBlock } from '../ui/CollapsibleBlock';

type BlockCollapsibleProps = {
  blockId: string;
  initialOpen?: boolean;
  header?: React.ReactNode;
  children?: React.ReactNode;
};

export function BlockCollapsible({
  blockId,
  initialOpen,
  header,
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
    <CollapsibleBlock open={open} onOpenChange={(next) => setOpen(blockId, next)} header={header}>
      {children}
    </CollapsibleBlock>
  );
}
