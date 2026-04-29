import { useState } from 'react';
import type { InitOptions } from '../../types/chat';
import { Button } from '../ui/Button';
import { Dialog, DialogContent } from '../ui/Dialog';

interface InitOptionsDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (opts: InitOptions) => void;
  initial?: InitOptions;
}

const LABEL_CLASS = 'flex flex-col gap-1 text-xs text-text-muted';
const TEXTAREA_LG =
  'bg-code-block border border-border rounded p-2 text-sm text-text font-mono resize-y min-h-15';
const TEXTAREA_SM =
  'bg-code-block border border-border rounded p-2 text-sm text-text font-mono resize-y min-h-10';

const HOOK_DEFS = [
  { key: 'captureBaseline', label: 'captureBaseline (PreToolUse)', section: 'PreToolUse' },
  { key: 'saveFileIfNeeded', label: 'saveFileIfNeeded (PreToolUse)', section: 'PreToolUse' },
  {
    key: 'findDiagnosticsProblems',
    label: 'findDiagnosticsProblems (PostToolUse)',
    section: 'PostToolUse',
  },
] as const;

function buildEnabledHooks(
  hooks: Record<string, boolean>,
): Record<string, Array<{ matcher: string; hookCallbackIds: string[] }>> {
  const enabled: Record<string, Array<{ matcher: string; hookCallbackIds: string[] }>> = {};
  for (const def of HOOK_DEFS) {
    if (!hooks[def.key]) continue;
    let section = enabled[def.section];
    if (!section) {
      section = [];
      enabled[def.section] = section;
    }
    section.push({ matcher: def.key, hookCallbackIds: [def.key] });
  }
  return enabled;
}

function buildInitOptions(state: {
  systemPrompt: string;
  appendSystemPrompt: string;
  jsonSchema: string;
  agents: string;
  hooks: Record<string, boolean>;
}): InitOptions {
  const opts: InitOptions = {};
  if (state.systemPrompt) opts.systemPrompt = state.systemPrompt;
  if (state.appendSystemPrompt) opts.appendSystemPrompt = state.appendSystemPrompt;
  if (state.jsonSchema) opts.jsonSchema = state.jsonSchema;
  if (state.agents) opts.agents = state.agents;
  const enabledHooks = buildEnabledHooks(state.hooks);
  if (Object.keys(enabledHooks).length > 0) opts.hooks = enabledHooks;
  return opts;
}

export function InitOptionsDialog({
  open,
  onClose,
  onSave,
  initial,
}: InitOptionsDialogProps): React.JSX.Element {
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt ?? '');
  const [appendSystemPrompt, setAppendSystemPrompt] = useState(initial?.appendSystemPrompt ?? '');
  const [jsonSchema, setJsonSchema] = useState(String(initial?.jsonSchema ?? ''));
  const [agents, setAgents] = useState(String(initial?.agents ?? ''));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hooks, setHooks] = useState<Record<string, boolean>>({
    captureBaseline: false,
    saveFileIfNeeded: false,
    findDiagnosticsProblems: false,
  });

  const handleSave = () => {
    onSave(buildInitOptions({ systemPrompt, appendSystemPrompt, jsonSchema, agents, hooks }));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent title="Init Options" className="max-w-md w-full">
        <div className="flex flex-col gap-3">
          <label className={LABEL_CLASS}>
            System Prompt
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className={TEXTAREA_LG}
            />
          </label>
          <label className={LABEL_CLASS}>
            Append System Prompt
            <textarea
              value={appendSystemPrompt}
              onChange={(e) => setAppendSystemPrompt(e.target.value)}
              className={TEXTAREA_LG}
            />
          </label>
          <details
            open={showAdvanced}
            onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
          >
            <summary className="cursor-pointer text-xs text-text-muted hover:text-text select-none py-1">
              Advanced
            </summary>
            <div className="flex flex-col gap-3 mt-2">
              <label className={LABEL_CLASS}>
                JSON Schema
                <textarea
                  value={jsonSchema}
                  onChange={(e) => setJsonSchema(e.target.value)}
                  placeholder="JSON schema object"
                  className={TEXTAREA_SM}
                />
              </label>
              <label className={LABEL_CLASS}>
                Agents
                <textarea
                  value={agents}
                  onChange={(e) => setAgents(e.target.value)}
                  placeholder="JSON array of agent configs"
                  className={TEXTAREA_SM}
                />
              </label>
              <fieldset className="flex flex-col gap-1">
                <legend className="text-xs text-text-muted mb-1">Hooks</legend>
                {HOOK_DEFS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-xs text-text-muted">
                    <input
                      type="checkbox"
                      checked={hooks[key]}
                      onChange={(e) => setHooks((h) => ({ ...h, [key]: e.target.checked }))}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
            </div>
          </details>
        </div>
        <p className="text-xs text-text-muted/60 mt-3">Takes effect on next session creation.</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" size="xs" onClick={onClose}>
            Cancel
          </Button>
          <Button size="xs" onClick={handleSave}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
