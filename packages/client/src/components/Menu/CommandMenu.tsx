import { useCallback, useEffect, useState } from 'react';

export type BattleMonitorMode = 'background' | 'observe' | 'realtime';

export interface CommandMenuItem {
  id: string;
  label: string;
  icon?: string;
  hasBattle?: boolean;
  battleHpPercent?: number;
  battleProgress?: string;
  isWorktree?: boolean;
  monitorMode?: BattleMonitorMode;
  needsAttention?: boolean;
}

interface CommandMenuProps {
  items: CommandMenuItem[];
  activeId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function CommandMenu({ items, activeId, onSelect, onClose }: CommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const idx = items.findIndex((item) => item.id === activeId);
    return idx >= 0 ? idx : 0;
  });

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (items[selectedIndex]) {
            onSelect(items[selectedIndex].id);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [items, selectedIndex, onSelect, onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="command-menu" data-testid="command-menu">
      <div className="command-menu-header">Sessions</div>
      <ul className="command-menu-list">
        {items.map((item, index) => (
          <li
            key={item.id}
            className={`command-menu-item ${index === selectedIndex ? 'selected' : ''} ${item.id === activeId ? 'active' : ''}`}
            data-testid={`menu-item-${item.id}`}
            onClick={() => {
              onSelect(item.id);
              onClose();
            }}
            onKeyDown={() => {}}
          >
            <span className="menu-cursor">{index === selectedIndex ? '▶' : ' '}</span>
            <span className="menu-label">{item.label}</span>
            {item.isWorktree && <span className="worktree-badge">🟣</span>}
            {item.hasBattle && (
              <span className="battle-indicator" data-testid="battle-indicator">
                ⚔{item.battleHpPercent !== undefined && ` ${item.battleHpPercent}%`}
              </span>
            )}
            {item.monitorMode && (
              <span className="monitor-badge" data-testid={`monitor-${item.id}`}>
                {item.monitorMode === 'background'
                  ? '🔇'
                  : item.monitorMode === 'observe'
                    ? '👁️'
                    : '📺'}
              </span>
            )}
            {item.needsAttention && (
              <span className="attention-badge" data-testid={`attention-${item.id}`}>
                ❗
              </span>
            )}
          </li>
        ))}
      </ul>

      <style>{`
        .command-menu {
          position: absolute;
          top: 40px;
          left: 8px;
          min-width: 220px;
          background: #1e1e1e;
          border: 2px solid #fff;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          color: #fff;
          z-index: 30;
          padding: 8px 0;
        }

        .command-menu-header {
          padding: 4px 12px 8px;
          font-weight: bold;
          border-bottom: 1px solid #555;
          margin-bottom: 4px;
        }

        .command-menu-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .command-menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          cursor: pointer;
        }

        .command-menu-item.selected {
          background: #333;
        }

        .command-menu-item.active .menu-label {
          color: #ffd54f;
        }

        .menu-cursor {
          width: 16px;
          font-size: 12px;
        }

        .battle-indicator {
          margin-left: auto;
          color: #ef5350;
        }
      `}</style>
    </div>
  );
}
