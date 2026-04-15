import type { ModelInfo } from '@code-quest/shared';
import { useEffect, useRef, useState } from 'react';
import { getModelDisplayInfo, getModelInfoDisplayName, shortModelName } from '../utils/model-utils';

interface ModelPickerPanelProps {
  currentModel: string | null;
  availableModels: ModelInfo[];
  onSwitch: (model: string) => void;
  onClose: () => void;
  defaultModelDescription?: string;
}

export function ModelPickerPanel({
  currentModel,
  availableModels,
  onSwitch,
  onClose,
  defaultModelDescription,
}: ModelPickerPanelProps) {
  const defaultModelValue = availableModels[0]?.value ?? null;
  const hasDefaultEntry = availableModels.some(
    (m) => m.value === 'default' || m.displayName === 'Default (recommended)',
  );

  const items: Array<{ id: string; value: string }> = [];
  if (!hasDefaultEntry) items.push({ id: '__default__', value: '' });
  for (const m of availableModels) items.push({ id: m.value, value: m.value });

  const initialIndex = items.findIndex(
    (item) => (item.value === '' ? defaultModelValue : item.value) === currentModel,
  );
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus so keyboard events are received immediately on open
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handleSelect = (value: string) => {
    onSwitch(value === '' ? (defaultModelValue ?? '') : value);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(items[activeIndex].value);
      return;
    }
  };

  const isActive = (index: number) => index === activeIndex;

  return (
    <div
      ref={containerRef}
      role="listbox"
      tabIndex={0}
      className="absolute bottom-full left-0 right-0 mb-1 bg-surface border border-border rounded-[4px] shadow-lg z-50 overflow-hidden text-xs animate-fade-in-fast max-h-[300px] overflow-y-auto pb-2 focus:outline-none"
      onKeyDown={handleKeyDown}
    >
      {/* Default (recommended) sentinel — only when server doesn't provide one */}
      {!hasDefaultEntry &&
        (() => {
          const { displayName, subLabel } = getModelDisplayInfo(
            '',
            availableModels,
            defaultModelDescription,
          );
          const index = 0;
          const isSelected = currentModel === defaultModelValue;
          return (
            <button
              key="__default__"
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => handleSelect('')}
              className={`w-full text-left mx-1 px-2 py-1 flex items-center justify-between transition-colors rounded-[3px] ${isActive(index) ? 'bg-selected' : 'hover:bg-white/10'}`}
            >
              <div>
                <div className="text-text font-medium">{displayName}</div>
                <div className="text-text-muted text-[10px] mt-0.5 opacity-70">{subLabel}</div>
              </div>
              {isSelected && <span className="text-text-muted shrink-0 ml-3">✓</span>}
            </button>
          );
        })()}
      {availableModels.map((item, i) => {
        const index = hasDefaultEntry ? i : i + 1;
        const { displayName, subLabel } = getModelInfoDisplayName(
          item,
          item.value,
          availableModels,
        );
        const isSelected = currentModel === item.value;
        return (
          <button
            key={item.value}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => handleSelect(item.value)}
            className={`w-full text-left mx-1 px-2 py-1 flex items-center justify-between transition-colors rounded-[3px] ${isActive(index) ? 'bg-selected' : 'hover:bg-white/10'}`}
          >
            <div>
              <div className="text-text font-medium">{displayName}</div>
              <div className="text-text-muted text-[10px] mt-0.5 opacity-70">{subLabel}</div>
            </div>
            {isSelected && <span className="text-text-muted shrink-0 ml-3">✓</span>}
          </button>
        );
      })}
    </div>
  );
}

export function currentModelLabel(model: string | null, availableModels: ModelInfo[] = []): string {
  if (!model) return 'Model';
  return shortModelName(model, availableModels);
}
