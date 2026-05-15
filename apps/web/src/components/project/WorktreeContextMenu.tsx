import * as ContextMenu from '@radix-ui/react-context-menu';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { ComponentType, ReactNode } from 'react';
import { menuContentClass as MENU_CONTENT_CLASS } from '../ui/MenuContent.tsx';
import { dangerMenuItemClass, menuItemClass } from '../ui/MenuItem.tsx';

interface WorktreeMenuCallbacks {
  onOpenHere?: () => void;
  onOpenInNewChat: () => void;
  onCopyPath: () => void;
  onRename?: () => void;
  onArchive?: () => void;
  onDelete: () => void;
}

type MenuItem = {
  key: string;
  label: string;
  onSelect: () => void;
  danger?: boolean;
  separatorBefore?: boolean;
};

type ItemProps = { onSelect: () => void; className: string; children: ReactNode };
type SeparatorProps = { className: string };

function renderItems(
  items: MenuItem[],
  Item: ComponentType<ItemProps>,
  Separator: ComponentType<SeparatorProps>,
) {
  return items.map((item) => (
    <div key={item.key}>
      {item.separatorBefore && <Separator className="my-1 border-t border-border" />}
      <Item onSelect={item.onSelect} className={item.danger ? dangerMenuItemClass : menuItemClass}>
        {item.label}
      </Item>
    </div>
  ));
}

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
          className={MENU_CONTENT_CLASS}
        >
          {renderItems(items, DropdownMenu.Item, DropdownMenu.Separator)}
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
        <ContextMenu.Content className={MENU_CONTENT_CLASS}>
          {renderItems(items, ContextMenu.Item, ContextMenu.Separator)}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
