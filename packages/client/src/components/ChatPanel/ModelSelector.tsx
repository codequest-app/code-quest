interface ModelInfo {
  value: string;
  displayName: string;
  description: string;
  supportsEffort?: boolean;
}

interface ModelSelectorProps {
  models?: ModelInfo[];
  currentModel?: string;
  onModelChange?: (model: string) => void;
}

export function ModelSelector({ models, currentModel, onModelChange }: ModelSelectorProps) {
  if (!models || models.length === 0) {
    return null;
  }

  return (
    <>
      <select
        className="model-selector"
        data-testid="model-selector"
        value={currentModel ?? ''}
        onChange={(e) => onModelChange?.(e.target.value)}
      >
        {models.map((model) => (
          <option key={model.value} value={model.value}>
            {model.displayName}
          </option>
        ))}
      </select>
      <style>{`
        .model-selector {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 3px;
          padding: 1px 4px;
          font-size: 12px;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
