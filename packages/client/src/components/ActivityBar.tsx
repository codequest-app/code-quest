import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface ActivityBarItem {
  id: string;
  icon: ReactNode;
  title: string;
}

interface ActivityBarProps {
  items: ActivityBarItem[];
  activePanel: string | null;
  onToggle: (panelId: string | null) => void;
}

export function ActivityBar({ items, activePanel, onToggle }: ActivityBarProps) {
  return (
    <div className="flex flex-col items-center w-10 bg-surface border-r border-border shrink-0">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          title={item.title}
          data-active={String(activePanel === item.id)}
          onClick={() => onToggle(activePanel === item.id ? null : item.id)}
          className={cn(
            'flex items-center justify-center w-10 h-10 text-sm hover:bg-white/10',
            activePanel === item.id ? 'border-l-2 border-accent text-text' : 'text-text-muted',
          )}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
}
