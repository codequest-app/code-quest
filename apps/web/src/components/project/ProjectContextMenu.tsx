import * as ContextMenu from '@radix-ui/react-context-menu';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { type ComponentType, type ReactNode, useContext } from 'react';
import { AppInitStateContext } from '@/contexts/AppInitContext';
import { menuContentClass as MENU_CONTENT_CLASS } from '../ui/MenuContent.tsx';
import { dangerMenuItemClass, menuItemClass } from '../ui/MenuItem.tsx';

type MenuItem = {
  key: string;
  label: ReactNode;
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

export interface ProjectMenuCallbacks {
  onSelectResume: () => void;
  onSelectCreateWorktree?: () => void;
  onSelectRename?: () => void;
  onSelectRemove?: () => void;
  onSelectInitRepo?: () => void;
}

function useItemList(callbacks: ProjectMenuCallbacks) {
  const capabilities = useContext(AppInitStateContext)?.capabilities ?? { worktree: false };
  const items: Array<{
    key: string;
    label: ReactNode;
    onSelect: () => void;
    danger?: boolean;
    separatorBefore?: boolean;
  }> = [{ key: 'resume', label: 'Resume session…', onSelect: callbacks.onSelectResume }];
  if (capabilities.worktree && callbacks.onSelectCreateWorktree) {
    items.push({
      key: 'worktree',
      label: 'Create Worktree…',
      onSelect: callbacks.onSelectCreateWorktree,
    });
  }
  if (callbacks.onSelectInitRepo) {
    items.push({
      key: 'init',
      label: 'Initialize as git repo',
      onSelect: callbacks.onSelectInitRepo,
    });
  }
  if (callbacks.onSelectRename) {
    items.push({ key: 'rename', label: 'Rename…', onSelect: callbacks.onSelectRename });
  }
  if (callbacks.onSelectRemove) {
    items.push({
      key: 'remove',
      label: 'Remove…',
      onSelect: callbacks.onSelectRemove,
      danger: true,
      separatorBefore: true,
    });
  }
  return items;
}

interface DropdownProps extends ProjectMenuCallbacks {
  trigger: ReactNode;
}

export function ProjectDropdownMenu({ trigger, ...callbacks }: DropdownProps): React.JSX.Element {
  const items = useItemList(callbacks);
  return (
    <DropdownMenu.Root>
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

interface ContextProps extends ProjectMenuCallbacks {
  children: ReactNode;
  /** Disable the right-click menu (e.g. when no cwd available). */
  disabled?: boolean;
}

export function ProjectContextMenu({
  children,
  disabled,
  ...callbacks
}: ContextProps): React.JSX.Element {
  const items = useItemList(callbacks);
  if (disabled) return <>{children}</>;
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
