import { FIELD_CONTROL_CLASS, FieldRow } from './FieldRow';

/** "Create new branch" tab: new branch name + base branch + path override. */
export function NewPane({
  branchName,
  onBranchNameChange,
  baseBranch,
  baseOptions,
  onBaseChange,
  path,
  placeholderPath,
  onPathChange,
}: {
  branchName: string;
  onBranchNameChange: (v: string) => void;
  baseBranch: string;
  baseOptions: string[];
  onBaseChange: (v: string) => void;
  path: string;
  placeholderPath: string;
  onPathChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <FieldRow label="New branch name" htmlFor="wt-new-branch">
        <input
          id="wt-new-branch"
          type="text"
          value={branchName}
          onChange={(e) => onBranchNameChange(e.target.value)}
          placeholder="feature/my-thing"
          className={FIELD_CONTROL_CLASS}
        />
      </FieldRow>
      <FieldRow label="Base branch" htmlFor="wt-base-branch">
        <select
          id="wt-base-branch"
          value={baseBranch}
          onChange={(e) => onBaseChange(e.target.value)}
          className={FIELD_CONTROL_CLASS}
        >
          {baseOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </FieldRow>
      <FieldRow label="Path (auto if empty)" htmlFor="wt-new-path">
        <input
          id="wt-new-path"
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
