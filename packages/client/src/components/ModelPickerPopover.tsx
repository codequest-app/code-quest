import type { ModelInfo } from '@code-quest/shared';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../utils/cn';
import { getModelDisplayInfo, getModelInfoDisplayName, shortModelName } from '../utils/model-utils';
import { focusRing } from './ui/_tokens';

const optionButtonClass = (isActive: boolean) =>
  cn(
    'w-full text-left mx-1 px-2 py-1 flex items-center justify-between transition-colors rounded-sm',
    isActive ? 'bg-selected' : 'hover:tint-10',
    focusRing,
  );

interface ModelPickerPopoverProps {
  currentModel: string | null;
  availableModels: ModelInfo[];
  onSwitch: (model: string) => void;
  defaultModelDescription?: string;
}

function DefaultModelOption({
  availableModels,
  defaultModelDescription,
  isSelected,
  isActive,
  onSelect,
}: {
  availableModels: ModelInfo[];
  defaultModelDescription?: string;
  isSelected: boolean;
  isActive: boolean;
  onSelect: () => void;
}) {
  const { displayName, subLabel } = getModelDisplayInfo(
    '',
    availableModels,
    defaultModelDescription,
  );
  return (
    <button
      key="__default__"
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={onSelect}
      className={optionButtonClass(isActive)}
    >
      <div>
        <div className="text-text font-medium">{displayName}</div>
        <div className="text-text-muted text-xs mt-0.5 opacity-70">{subLabel}</div>
      </div>
      {isSelected && <span className="text-text-muted shrink-0 ml-3">✓</span>}
    </button>
  );
}

export function ModelPickerPopover({
  currentModel,
  availableModels,
  onSwitch,
  defaultModelDescription,
}: ModelPickerPopoverProps): React.JSX.Element {
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
  const listboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listboxRef.current?.focus();
  }, []);

  const handleSelect = (value: string) => {
    onSwitch(value === '' ? (defaultModelValue ?? '') : value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
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
      const item = items[activeIndex];
      if (item) handleSelect(item.value);
      return;
    }
  };

  const isActive = (index: number) => index === activeIndex;

  return (
    <div
      ref={listboxRef}
      role="listbox"
      tabIndex={0}
      className="bg-surface border border-border rounded shadow-lg overflow-hidden text-xs animate-fade-in-fast max-h-75 overflow-y-auto pb-2 focus:outline-none"
      onKeyDown={handleKeyDown}
    >
      {/* Default (recommended) sentinel — only when server doesn't provide one */}
      {!hasDefaultEntry && (
        <DefaultModelOption
          availableModels={availableModels}
          defaultModelDescription={defaultModelDescription}
          isSelected={currentModel === defaultModelValue}
          isActive={isActive(0)}
          onSelect={() => handleSelect('')}
        />
      )}
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
            className={optionButtonClass(isActive(index))}
          >
            <div>
              <div className="text-text font-medium">{displayName}</div>
              <div className="text-text-muted text-xs mt-0.5 opacity-70">{subLabel}</div>
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
