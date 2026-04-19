import { asyncDataLoaderFeature } from '@headless-tree/core';
import { useTree } from '@headless-tree/react/react-compiler';
import { FolderIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useExplorerBrowse } from '../hooks/useExplorerBrowse';
import { cn } from '../utils/cn';

interface DirectoryItem {
  name: string;
  path: string;
}

export function FileTree({
  onSelect,
  onHighlight,
  highlightedPath,
}: {
  onSelect?: (path: string) => void;
  onHighlight?: (path: string) => void;
  highlightedPath?: string | null;
}) {
  const { browse } = useExplorerBrowse();
  const [contextMenu, setContextMenu] = useState<{ path: string; x: number; y: number } | null>(
    null,
  );

  // Controlled state for async loader (required)
  const [loadingItemData, setLoadingItemData] = useState<string[]>([]);
  const [loadingItemChildrens, setLoadingItemChildrens] = useState<string[]>([]);

  // Close context menu on click
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [contextMenu]);

  const getTree = useTree<DirectoryItem>({
    rootItemId: 'root',
    state: { loadingItemData, loadingItemChildrens },
    setLoadingItemData,
    setLoadingItemChildrens,
    getItemName: (item) => item.getItemData().name,
    isItemFolder: () => true,
    createLoadingItemData: () => ({ name: 'Loading...', path: '' }),
    dataLoader: {
      getItem: (itemId) => ({ name: itemId.split('/').pop() ?? itemId, path: itemId }),
      getChildrenWithData: async (itemId) => {
        const path = itemId === 'root' ? undefined : itemId;
        const directories = await browse(path);
        return directories.map((d) => ({ id: d.path, data: d }));
      },
    },
    features: [asyncDataLoaderFeature],
  });

  const tree = getTree();

  return (
    <div {...tree.getContainerProps()} role="tree" className="relative">
      {tree.getItems().map((item) => {
        const data = item.getItemData();
        const isHighlighted = highlightedPath === data.path;
        return (
          // biome-ignore lint/a11y/noStaticElementInteractions: item.getProps() provides role + tabIndex
          // biome-ignore lint/a11y/useKeyWithClickEvents: headless-tree handles keyboard via getProps()
          <div
            key={item.getId()}
            {...item.getProps()}
            className={cn(
              'flex items-center px-1 py-0.5 cursor-pointer text-sm select-none',
              isHighlighted ? 'bg-accent/20' : 'hover:bg-white/5',
            )}
            style={{ paddingLeft: `${item.getItemMeta().level * 16 + 4}px` }}
            onClick={(e) => {
              item.getProps().onClick?.(e);
              onHighlight?.(data.path);
            }}
            onDoubleClick={() => {
              if (data.path) onSelect?.(data.path);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (data.path) setContextMenu({ path: data.path, x: e.clientX, y: e.clientY });
            }}
          >
            <span className="mr-1 inline-flex items-center">
              {item.isExpanded() ? (
                <FolderOpenIcon className="w-4 h-4" />
              ) : (
                <FolderIcon className="w-4 h-4" />
              )}
            </span>
            {item.getItemName()}
          </div>
        );
      })}

      {contextMenu && (
        <div
          className="fixed z-modal bg-surface border border-border rounded shadow-lg py-1 min-w-40"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            type="button"
            className="w-full px-3 py-1 text-left text-sm hover:bg-accent/20"
            onClick={() => {
              onSelect?.(contextMenu.path);
              setContextMenu(null);
            }}
          >
            Open in New Tab
          </button>
        </div>
      )}
    </div>
  );
}
