import { getModelDisplayInfo, getModelInfoDisplayName, shortModelName } from '../utils/model-utils';

interface ModelPickerPanelProps {
  currentModel: string | null;
  availableModels: Array<{ value: string; label?: string; displayName?: string }>;
  onSwitch: (model: string) => void;
  onClose: () => void;
}

export function ModelPickerPanel({
  currentModel,
  availableModels,
  onSwitch,
  onClose,
}: ModelPickerPanelProps) {
  const defaultModelValue = availableModels[0]?.value ?? null;
  // Skip the synthetic "Default" sentinel when the server already provides one
  const hasDefaultEntry = availableModels.some(
    (m) => m.value === 'default' || m.displayName === 'Default (recommended)',
  );

  const handleSelect = (id: string) => {
    // "" sentinel → use the server-default (first available model)
    onSwitch(id === '' ? (defaultModelValue ?? '') : id);
    onClose();
  };

  return (
    <div
      role="listbox"
      className="absolute bottom-full left-0 right-0 mb-1 bg-surface border border-border rounded-[4px] shadow-lg z-50 overflow-hidden text-xs animate-fade-in-fast max-h-[300px] overflow-y-auto pb-2"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      {/* Default (recommended) sentinel — only when server doesn't provide one */}
      {!hasDefaultEntry &&
        (() => {
          const { displayName, subLabel } = getModelDisplayInfo('', defaultModelValue);
          const isSelected = currentModel === defaultModelValue;
          return (
            <button
              key="__default__"
              type="button"
              onClick={() => handleSelect('')}
              className="w-full text-left mx-1 px-2 py-1 hover:bg-white/10 flex items-center justify-between transition-colors rounded-[3px]"
            >
              <div>
                <div className="text-text font-medium">{displayName}</div>
                <div className="text-text-muted text-[10px] mt-0.5 opacity-70">{subLabel}</div>
              </div>
              {isSelected && <span className="text-text-muted shrink-0 ml-3">✓</span>}
            </button>
          );
        })()}
      {availableModels.map((item) => {
        const { displayName, subLabel } = getModelInfoDisplayName(item, item.value);
        const isSelected = currentModel === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => handleSelect(item.value)}
            className="w-full text-left mx-1 px-2 py-1 hover:bg-white/10 flex items-center justify-between transition-colors rounded-[3px]"
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

export function currentModelLabel(
  model: string | null,
  availableModels?: { value: string; displayName?: string }[],
): string {
  if (!model) return 'Model';
  const info = availableModels?.find((m) => m.value === model);
  if (info?.displayName) return info.displayName;
  return shortModelName(model);
}
