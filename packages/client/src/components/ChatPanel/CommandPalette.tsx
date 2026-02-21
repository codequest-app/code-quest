import { useEffect, useState } from 'react';

interface Command {
  name: string;
  description: string;
}

interface CommandPaletteProps {
  commands?: Command[];
  onCommandSelect?: (commandName: string) => void;
  onClose?: () => void;
}

export function CommandPalette({ commands, onCommandSelect, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!commands || commands.length === 0) {
    return null;
  }

  const filtered = commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="command-palette" data-testid="command-palette">
      <input
        type="text"
        className="command-search"
        data-testid="command-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search commands..."
      />
      <div className="command-list" data-testid="command-list">
        {filtered.map((cmd) => (
          <button
            key={cmd.name}
            type="button"
            className="command-item"
            data-testid={`command-${cmd.name}`}
            onClick={() => onCommandSelect?.(cmd.name)}
          >
            <span className="command-name">/{cmd.name}</span>
            <span className="command-desc">{cmd.description}</span>
          </button>
        ))}
      </div>
      <style>{`
        .command-palette {
          position: absolute;
          bottom: 100%;
          left: 0;
          right: 0;
          background: #2d2d30;
          border: 1px solid #007acc;
          border-radius: 8px;
          margin: 0 12px 8px;
          padding: 8px;
          z-index: 20;
          max-height: 240px;
          overflow-y: auto;
        }
        .command-search {
          width: 100%;
          padding: 6px 8px;
          background: #1e1e1e;
          border: 1px solid #3e3e42;
          border-radius: 4px;
          color: #d4d4d4;
          font-size: 13px;
          margin-bottom: 8px;
          box-sizing: border-box;
        }
        .command-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .command-item {
          display: flex;
          gap: 8px;
          padding: 6px 8px;
          background: transparent;
          border: none;
          border-radius: 4px;
          color: #d4d4d4;
          font-size: 13px;
          cursor: pointer;
          text-align: left;
          width: 100%;
        }
        .command-item:hover {
          background: #3e3e42;
        }
        .command-name {
          color: #007acc;
          font-weight: 500;
          white-space: nowrap;
        }
        .command-desc {
          color: #9e9e9e;
        }
      `}</style>
    </div>
  );
}
