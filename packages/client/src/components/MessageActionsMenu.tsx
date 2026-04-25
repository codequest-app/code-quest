import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export interface MessageActionItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

interface MessageActionsMenuProps {
  items: ReadonlyArray<MessageActionItem | false | '' | null | undefined>;
}

export function MessageActionsMenu({ items }: MessageActionsMenuProps) {
  const visible = items.filter((i): i is MessageActionItem => Boolean(i));

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          title="Message actions"
          className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full border border-border text-text-muted hover:text-text hover:bg-white/5 transition-opacity cursor-pointer"
        >
          <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          collisionPadding={8}
          className="flex flex-col bg-surface border border-border rounded-lg shadow-floating z-popover min-w-50 py-1"
        >
          {visible.map((item) => (
            <DropdownMenu.Item
              key={item.label}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className="w-full text-left px-3 py-1.5 text-xs text-text hover:bg-white/5 data-[disabled]:opacity-50 data-[highlighted]:bg-white/5 outline-none cursor-pointer transition-colors"
            >
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
