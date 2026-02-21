interface PermissionModeSelectorProps {
  currentMode?: string;
  onModeChange?: (mode: string) => void;
}

const PERMISSION_MODES = [
  { value: 'default', label: 'Default' },
  { value: 'acceptEdits', label: 'Accept Edits' },
];

export function PermissionModeSelector({ currentMode, onModeChange }: PermissionModeSelectorProps) {
  return (
    <>
      <select
        className="permission-mode-selector"
        data-testid="permission-mode-selector"
        value={currentMode ?? 'default'}
        onChange={(e) => onModeChange?.(e.target.value)}
      >
        {PERMISSION_MODES.map((mode) => (
          <option key={mode.value} value={mode.value}>
            {mode.label}
          </option>
        ))}
      </select>
      <style>{`
        .permission-mode-selector {
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
