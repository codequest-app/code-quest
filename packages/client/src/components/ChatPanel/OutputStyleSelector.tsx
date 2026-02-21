interface OutputStyleSelectorProps {
  availableStyles?: string[];
  currentStyle?: string;
  onStyleChange?: (style: string) => void;
}

export function OutputStyleSelector({
  availableStyles,
  currentStyle,
  onStyleChange,
}: OutputStyleSelectorProps) {
  if (!availableStyles || availableStyles.length === 0) {
    return null;
  }

  return (
    <>
      <select
        className="output-style-selector"
        data-testid="output-style-selector"
        value={currentStyle ?? ''}
        onChange={(e) => onStyleChange?.(e.target.value)}
      >
        {availableStyles.map((style) => (
          <option key={style} value={style}>
            {style}
          </option>
        ))}
      </select>
      <style>{`
        .output-style-selector {
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
