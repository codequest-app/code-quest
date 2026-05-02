import { FIELD_CONTROL_CLASS, FieldRow } from './FieldRow.tsx';

/** "Checkout existing" tab: branch dropdown + path override. */
export function ExistingPane({
  branches,
  value,
  onBranchChange,
  path,
  placeholderPath,
  onPathChange,
}: {
  branches: string[];
  value: string;
  onBranchChange: (v: string) => void;
  path: string;
  placeholderPath: string;
  onPathChange: (v: string) => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <FieldRow label="Branch" htmlFor="wt-existing-branch">
        <select
          id="wt-existing-branch"
          value={value}
          onChange={(e) => onBranchChange(e.target.value)}
          className={FIELD_CONTROL_CLASS}
        >
          <option value="">— select —</option>
          {branches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </FieldRow>
      <FieldRow label="Path" htmlFor="wt-existing-path">
        <input
          id="wt-existing-path"
          type="text"
          value={path}
          onChange={(e) => onPathChange(e.target.value)}
          placeholder={placeholderPath}
          className={FIELD_CONTROL_CLASS}
        />
      </FieldRow>
    </div>
  );
}
