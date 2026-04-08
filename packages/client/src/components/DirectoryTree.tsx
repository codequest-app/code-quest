import type { ExplorerDirectory } from '@code-quest/shared';
import { useEffect, useState } from 'react';
import { useExplorerBrowse } from '../hooks/useExplorerBrowse';

interface TreeNode {
  dir: ExplorerDirectory;
  children: TreeNode[] | null; // null = not loaded
  expanded: boolean;
}

export function DirectoryTree({
  onSelect,
  onHighlight,
  highlightedPath,
}: {
  onSelect?: (path: string) => void;
  onHighlight?: (path: string) => void;
  highlightedPath?: string | null;
}) {
  const { browse } = useExplorerBrowse();
  const [roots, setRoots] = useState<TreeNode[]>([]);
  const [contextMenu, setContextMenu] = useState<{ path: string; x: number; y: number } | null>(
    null,
  );

  useEffect(() => {
    browse().then((dirs) =>
      setRoots(dirs.map((d) => ({ dir: d, children: null, expanded: false }))),
    );
  }, [browse]);

  // Close context menu on click
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [contextMenu]);

  function updateNode(
    nodes: TreeNode[],
    path: string,
    updater: (n: TreeNode) => TreeNode,
  ): TreeNode[] {
    return nodes.map((n) => {
      if (n.dir.path === path) return updater(n);
      if (n.children) return { ...n, children: updateNode(n.children, path, updater) };
      return n;
    });
  }

  async function toggleExpand(node: TreeNode) {
    if (node.expanded) {
      setRoots((prev) => updateNode(prev, node.dir.path, (n) => ({ ...n, expanded: false })));
      return;
    }
    let children = node.children;
    if (children === null) {
      const dirs = await browse(node.dir.path);
      children = dirs.map((d) => ({ dir: d, children: null, expanded: false }));
    }
    setRoots((prev) =>
      updateNode(prev, node.dir.path, (n) => ({ ...n, expanded: true, children })),
    );
  }

  function renderNodes(nodes: TreeNode[], level: number): React.ReactNode {
    return nodes.map((node) => (
      <div key={node.dir.path}>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: tree item */}
        <div
          role="treeitem"
          aria-expanded={node.expanded}
          aria-label={node.dir.name}
          tabIndex={0}
          className={`flex items-center px-1 py-0.5 cursor-pointer text-sm select-none ${
            highlightedPath === node.dir.path ? 'bg-accent/20' : 'hover:bg-white/5'
          }`}
          style={{ paddingLeft: `${level * 16 + 4}px` }}
          onClick={() => {
            toggleExpand(node);
            onHighlight?.(node.dir.path);
          }}
          onDoubleClick={() => onSelect?.(node.dir.path)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({ path: node.dir.path, x: e.clientX, y: e.clientY });
          }}
        >
          <span className="mr-1">{node.expanded ? '📂' : '📁'}</span>
          {node.dir.name}
        </div>
        {node.expanded && node.children && renderNodes(node.children, level + 1)}
      </div>
    ));
  }

  return (
    <div role="tree" className="relative">
      {renderNodes(roots, 0)}

      {contextMenu && (
        <div
          className="fixed z-50 bg-surface border border-border rounded shadow-lg py-1 min-w-[160px]"
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
