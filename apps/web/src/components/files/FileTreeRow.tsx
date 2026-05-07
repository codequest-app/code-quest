import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { Icon } from '@iconify/react';
import { forwardRef, type HTMLAttributes, type MouseEvent } from 'react';
import { cn } from '@/utils/cn';
import { getFileIcon } from '@/utils/getFileIcon';

interface EntryItem {
  name: string;
  path: string;
  kind: 'directory' | 'file';
}

const GIT_MARK_CLASS: Record<string, string> = {
  M: 'text-warning',
  A: 'text-success',
  D: 'text-danger',
  R: 'text-info',
  '??': 'text-success/70',
  U: 'text-success/70',
};

interface RowRenameState {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

// `Item` is structurally typed against the headless-tree iterator API
// instead of importing the package's deeply-generic ItemInstance type —
// the methods we actually call form a small, stable subset.
interface RowItem {
  getId: () => string;
  getProps: () => Record<string, unknown> & { onClick?: (e: MouseEvent) => void };
  getItemMeta: () => { level: number };
  getItemData: () => EntryItem;
  getItemName: () => string;
  isExpanded: () => boolean;
}

/** Extends `HTMLAttributes` so Radix `ContextMenu.Trigger asChild` can
 *  forward its props (notably `onContextMenu`) onto the row's `<div>`. */
interface FileTreeRowProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick' | 'onDoubleClick'> {
  item: RowItem;
  isHighlighted: boolean;
  /** When true, render greyed-out + cursor-not-allowed. Click handlers
   *  remain wired (parent decides what to do); a11y exposed via aria-disabled. */
  isDisabled?: boolean;
  gitMark: string | undefined;
  rename: RowRenameState | null;
  onClick: (e: MouseEvent<HTMLDivElement>) => void;
  onDoubleClick: () => void;
}

/** Visual file/directory row. Stays tightly coupled to headless-tree's
 *  iteration locals (`item.getProps()` etc.) — that's the headless-tree
 *  contract, not an SRP issue. ContextMenu wrapping happens at the call
 *  site so this component doesn't carry menu props. */
export const FileTreeRow: React.ForwardRefExoticComponent<
  FileTreeRowProps & React.RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, FileTreeRowProps>(function FileTreeRow(
  { item, isHighlighted, isDisabled, gitMark, rename, onClick, onDoubleClick, ...slotProps },
  ref,
) {
  const data = item.getItemData();
  const isFile = data.kind === 'file';
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: item.getProps() provides role + tabIndex
    // biome-ignore lint/a11y/useKeyWithClickEvents: headless-tree handles keyboard via getProps()
    <div
      {...item.getProps()}
      {...slotProps}
      ref={ref}
      aria-disabled={isDisabled || undefined}
      className={cn(
        'flex items-center px-1 py-0.5 text-sm select-none',
        isDisabled
          ? 'cursor-not-allowed opacity-40'
          : ['cursor-pointer', isHighlighted ? 'bg-accent/20' : 'hover:bg-white/5'],
      )}
      style={{ paddingLeft: `${item.getItemMeta().level * 14 + 6}px` }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <span className="mr-1 inline-flex items-center">
        {isFile ? (
          <Icon icon={getFileIcon(item.getItemName())} className="w-4 h-4" />
        ) : (
          <>
            <ChevronRightIcon
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-150',
                item.isExpanded() && 'rotate-90',
              )}
            />
            <Icon
              icon={
                item.isExpanded() ? 'material-icon-theme:folder-open' : 'material-icon-theme:folder'
              }
              className="w-4 h-4 ml-0.5"
            />
          </>
        )}
      </span>
      {rename ? (
        <input
          // biome-ignore lint/a11y/noAutofocus: focus the inline-rename input on render
          autoFocus
          value={rename.value}
          onChange={(e) => rename.onChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') rename.onSubmit();
            if (e.key === 'Escape') rename.onCancel();
          }}
          onBlur={() => rename.onSubmit()}
          className="flex-1 px-1 py-0 text-sm font-mono bg-bg/60 border border-accent rounded outline-none"
        />
      ) : (
        <span className="flex-1 truncate">{item.getItemName()}</span>
      )}
      {isFile && gitMark && (
        <span
          role="status"
          aria-label={`git-mark-${data.path}`}
          className={cn(
            'ml-2 font-mono text-xs px-1 rounded bg-white/5',
            GIT_MARK_CLASS[gitMark] ?? 'text-text-muted',
          )}
        >
          {gitMark}
        </span>
      )}
    </div>
  );
});
