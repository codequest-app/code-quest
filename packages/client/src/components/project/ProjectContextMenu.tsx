import * as ContextMenu from '@radix-ui/react-context-menu';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { type ReactNode, useContext } from 'react';
import { AppInitStateContext } from '../../contexts/AppInitContext';

export interface ProjectMenuCallbacks {
  onSelectResume: () => void;
  onSelectCreateWorktree?: () => void;
  onSelectRename?: () => void;
  onSelectRemove?: () => void;
  onSelectInitRepo?: () => void;
}

const ITEM_CLASS =
  'w-full text-left px-3 py-1.5 text-sm text-text hover:bg-white/5 data-[highlighted]:bg-white/5 outline-none cursor-pointer';
const DANGER_ITEM_CLASS =
  'w-full text-left px-3 py-1.5 text-sm text-danger hover:bg-danger/10 data-[highlighted]:bg-danger/10 outline-none cursor-pointer';
const CONTENT_CLASS =
  'z-modal min-w-45 rounded border border-border bg-surface shadow-floating py-1';

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
