import type { MutableRefObject } from 'react';
import type { MenuItem } from './command-menu-items';

interface MenuItemRowProps {
  item: MenuItem;
  isActive: boolean;
  activeItemRef: MutableRefObject<HTMLButtonElement | null>;
  onHover: (id: string) => void;
}

export function MenuItemRow({ item, isActive, activeItemRef, onHover }: MenuItemRowProps) {
  return (
    <button
      ref={isActive ? activeItemRef : null}
      type="button"
      disabled={item.disabled}
      onClick={item.onClick}
      onMouseEnter={() => onHover(item.id)}
      className={`text-left px-2 py-1 mx-1 rounded flex items-center justify-between disabled:text-text-muted disabled:cursor-not-allowed ${
        isActive ? 'bg-selected text-white' : 'text-text hover:bg-white/10'
      }`}
    >
      <span>{item.label}</span>
      {item.trailing && <span>{item.trailing}</span>}
    </button>
  );
}

interface MenuSectionProps {
  label: string;
  items: MenuItem[];
  activeId: string | null;
  activeItemRef: MutableRefObject<HTMLButtonElement | null>;
  onHover: (id: string) => void;
  isFirst?: boolean;
}

export function MenuSection({
  label,
  items,
  activeId,
  activeItemRef,
  onHover,
  isFirst = false,
}: MenuSectionProps) {
  if (items.length === 0) return null;
  return (
    <>
      {!isFirst && <div className="h-px bg-border my-1" />}
      <div className="px-3 py-1 text-[0.9em] opacity-50 text-text">{label}</div>
      {items.map((item) => (
        <MenuItemRow
          key={item.id}
          item={item}
          isActive={item.id === activeId}
          activeItemRef={activeItemRef}
          onHover={onHover}
        />
      ))}
    </>
  );
}
