import { useState } from 'react';
import type { InitOptions } from '../types/chat';
import { Dialog, DialogContent } from './ui/Dialog';

interface InitOptionsDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (opts: InitOptions) => void;
  initial?: InitOptions;
}

const LABEL_CLASS = 'flex flex-col gap-1 text-xs text-text-muted';
const TEXTAREA_LG =
  'bg-code-block border border-border rounded p-2 text-sm text-text font-mono resize-y min-h-[60px]';
const TEXTAREA_SM =
  'bg-code-block border border-border rounded p-2 text-sm text-text font-mono resize-y min-h-[40px]';

const HOOK_DEFS = [
  { key: 'captureBaseline', label: 'captureBaseline (PreToolUse)', category: 'PreToolUse' },
  { key: 'saveFileIfNeeded', label: 'saveFileIfNeeded (PreToolUse)', category: 'PreToolUse' },
  {
    key: 'findDiagnosticsProblems',
    label: 'findDiagnosticsProblems (PostToolUse)',
    category: 'PostToolUse',
  },
] as const;

export function InitOptionsDialog({ open, onClose, onSave, initial }: InitOptionsDialogProps) {
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt ?? '');
  const [appendSystemPrompt, setAppendSystemPrompt] = useState(initial?.appendSystemPrompt ?? '');
  const [jsonSchema, setJsonSchema] = useState((initial?.jsonSchema as string) ?? '');
  const [agents, setAgents] = useState((initial?.agents as string) ?? '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hooks, setHooks] = useState<Record<string, boolean>>({
    captureBaseline: false,
    saveFileIfNeeded: false,
    findDiagnosticsProblems: false,
  });

  const handleSave = () => {
    const opts: InitOptions = {};
    if (systemPrompt) opts.systemPrompt = systemPrompt;
    if (appendSystemPrompt) opts.appendSystemPrompt = appendSystemPrompt;
    if (jsonSchema) opts.jsonSchema = jsonSchema;
    if (agents) opts.agents = agents;

    const enabledHooks: Record<string, Array<{ matcher: string; hookCallbackIds: string[] }>> = {};
    for (const def of HOOK_DEFS) {
      if (hooks[def.key]) {
        if (!enabledHooks[def.category]) enabledHooks[def.category] = [];
        enabledHooks[def.category].push({ matcher: def.key, hookCallbackIds: [def.key] });
      }
    }
    if (Object.keys(enabledHooks).length > 0) opts.hooks = enabledHooks;

    onSave(opts);
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
        <p className="text-[11px] text-text-muted/60 mt-3">
          Takes effect on next session creation.
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded border border-border text-text-muted hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="text-xs px-3 py-1.5 rounded bg-accent text-white hover:bg-accent/80"
          >
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
