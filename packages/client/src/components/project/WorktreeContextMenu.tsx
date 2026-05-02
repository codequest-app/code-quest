import * as ContextMenu from '@radix-ui/react-context-menu';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { ReactNode } from 'react';

interface WorktreeMenuCallbacks {
  onOpenHere?: () => void;
  onOpenInNewChat: () => void;
  onCopyPath: () => void;
  onRename?: () => void;
  onArchive?: () => void;
  onDelete: () => void;
}

const ITEM_CLASS =
  'w-full text-left px-3 py-1.5 text-sm text-text hover:bg-white/5 data-[highlighted]:bg-white/5 outline-none cursor-pointer';
const DANGER_ITEM_CLASS =
  'w-full text-left px-3 py-1.5 text-sm text-danger hover:bg-white/5 data-[highlighted]:bg-white/5 outline-none cursor-pointer';
const CONTENT_CLASS =
  'z-modal min-w-45 rounded border border-border bg-surface shadow-floating py-1';

function buildItems(cb: WorktreeMenuCallbacks) {
  const items: Array<{
    key: string;
    label: string;
    onSelect: () => void;
    danger?: boolean;
    separatorBefore?: boolean;
  }> = [];
  if (cb.onOpenHere)
    items.push({ key: 'open', label: 'Open here (switch)', onSelect: cb.onOpenHere });
  items.push({ key: 'new-chat', label: 'Open in new chat', onSelect: cb.onOpenInNewChat });
  items.push({ key: 'copy', label: 'Copy path', onSelect: cb.onCopyPath });
  if (cb.onRename) items.push({ key: 'rename', label: 'Rename…', onSelect: cb.onRename });
  if (cb.onArchive) items.push({ key: 'archive', label: 'Archive', onSelect: cb.onArchive });
  items.push({
    key: 'delete',
    label: 'Delete',
    onSelect: cb.onDelete,
    danger: true,
    separatorBefore: true,
  });
  return items;
}

interface DropdownProps extends WorktreeMenuCallbacks {
  trigger: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

export function WorktreeDropdownMenu({
  trigger,
  open,
  onOpenChange,
  defaultOpen,
  ...callbacks
}: DropdownProps): React.JSX.Element {
  const items = buildItems(callbacks);
  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          collisionPadding={8}
          className={CONTENT_CLASS}
        >
          {items.map((item) => (
            <div key={item.key}>
              {item.separatorBefore && (
                <DropdownMenu.Separator className="my-1 border-t border-border" />
              )}
              <DropdownMenu.Item
                onSelect={item.onSelect}
                className={item.danger ? DANGER_ITEM_CLASS : ITEM_CLASS}
              >
                {item.label}
              </DropdownMenu.Item>
            </div>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

interface ContextProps extends WorktreeMenuCallbacks {
  children: ReactNode;
}

export function WorktreeContextMenu({ children, ...callbacks }: ContextProps): React.JSX.Element {
  const items = buildItems(callbacks);
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className={CONTENT_CLASS}>
          {items.map((item) => (
            <div key={item.key}>
              {item.separatorBefore && (
                <ContextMenu.Separator className="my-1 border-t border-border" />
              )}
              <ContextMenu.Item
                onSelect={item.onSelect}
                className={item.danger ? DANGER_ITEM_CLASS : ITEM_CLASS}
              >
                {item.label}
              </ContextMenu.Item>
            </div>
          ))}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
