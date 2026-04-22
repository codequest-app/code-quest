import { effortLevelSchema } from '@code-quest/shared';
import { useChannelConfig } from '../contexts/channel';
import { usePopover } from '../hooks/usePopover';
import { cn } from '../utils/cn';
import { EffortIcon, PERMISSION_MODE_ICONS } from './icons/PermissionModeIcons';
import { EffortSwitch, effortLabel } from './ui/EffortSwitch';
import { CheckMark } from './ui/Icons';

function getPermissionModes(brandName: string) {
  return [
    {
      id: 'normal',
      label: 'Ask before edits',
      title: `${brandName} will ask before each edit. Click, or press Shift+Tab, to switch modes.`,
      description: `${brandName} will ask for approval before making each edit`,
    },
    {
      id: 'acceptEdits',
      label: 'Edit automatically',
      title: `${brandName} will edit your selected text or the whole file. Click, or press Shift+Tab, to switch modes.`,
      description: `${brandName} will edit your selected text or the whole file`,
    },
    {
      id: 'plan',
      label: 'Plan mode',
      title: `${brandName} will explore the code and present a plan before editing. Click, or press Shift+Tab, to switch modes.`,
      description: `${brandName} will explore the code and present a plan before editing`,
    },
    {
      id: 'auto',
      label: 'Auto mode',
      title: `${brandName} will automatically choose the best permission mode for each task. Click, or press Shift+Tab, to switch modes.`,
      description: `${brandName} will automatically choose the best permission mode for each task`,
    },
    {
      id: 'bypassPermissions',
      label: 'Bypass permissions',
      title: `${brandName} Code will not ask for your approval before running potentially dangerous commands.`,
      description: `${brandName} will not ask for approval before running potentially dangerous commands`,
    },
  ];
}

const DEFAULT_MODES = getPermissionModes('Claude');
const DEFAULT_MODE = DEFAULT_MODES[0];

export interface PermissionModePickerProps {
  mode: string;
  effort?: string;
  effortLevels?: string[];
  supportsAutoMode?: boolean;
  onSetPermissionMode?: (mode: string) => void;
  onSetEffort?: (effort: string) => void;
}

export function PermissionModePicker({
  mode,
  effort = 'max',
  effortLevels = effortLevelSchema.options,
  supportsAutoMode = false,
  onSetPermissionMode,
  onSetEffort,
}: PermissionModePickerProps) {
  const { providerConfig } = useChannelConfig();
  const brandName = providerConfig?.brand.name ?? 'Claude';
  const configModes = providerConfig?.permissionModes;
  const allModes = configModes?.length
    ? configModes.map((m) => ({
        ...m,
        title: `${m.description}. Click, or press Shift+Tab, to switch modes.`,
      }))
    : getPermissionModes(brandName);
  const permissionModes = allModes.filter((m) => m.id !== 'auto' || supportsAutoMode);
  const permissionById = Object.fromEntries(permissionModes.map((m) => [m.id, m]));

  const {
    open: showModePicker,
    setOpen: setShowModePicker,
    triggerRef: modeButtonRef,
    panelRef: modePickerRef,
  } = usePopover<HTMLButtonElement, HTMLDivElement>();

  return (
    <div className="relative">
      <button
        ref={modeButtonRef}
        type="button"
        title={(permissionById[mode] ?? DEFAULT_MODE).title}
        onClick={() => setShowModePicker((v) => !v)}
        className="permission-mode-btn text-xs text-text-bright bg-transparent border-none cursor-pointer shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded-sm hover:bg-white/5"
      >
        <span className="w-4 h-4 shrink-0">
          {PERMISSION_MODE_ICONS[mode as keyof typeof PERMISSION_MODE_ICONS] ??
            PERMISSION_MODE_ICONS.normal}
        </span>
        <span>{(permissionById[mode] ?? DEFAULT_MODE).label}</span>
      </button>
      {showModePicker && (
        <div
          ref={modePickerRef}
          className="absolute bottom-full right-0 mb-1 bg-surface border border-border rounded-lg shadow-lg z-modal min-w-70 py-1"
        >
          <div className="px-3 py-1.5 text-xs text-text-muted flex items-center justify-between">
            <span className="font-semibold">Modes</span>
            <span className="opacity-60 flex items-center gap-1">
              <kbd className="bg-white/10 rounded px-1 text-xs">⇧</kbd> +{' '}
              <kbd className="bg-white/10 rounded px-1 text-xs">tab</kbd> to switch
            </span>
          </div>
          {permissionModes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onSetPermissionMode?.(m.id);
                setShowModePicker(false);
              }}
              className={cn(
                'w-full text-left px-3 py-2 flex items-center gap-3 cursor-pointer transition-colors',
                m.id === mode ? 'bg-selected text-white' : 'hover:bg-white/5',
              )}
            >
              <span className="w-5 h-5 shrink-0">
                {PERMISSION_MODE_ICONS[m.id as keyof typeof PERMISSION_MODE_ICONS]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs">{m.label}</div>
                <div className="text-xs opacity-70">{m.description}</div>
              </div>
              <span className="w-4 shrink-0">
                {m.id === mode && <CheckMark className="w-4 h-4" />}
              </span>
            </button>
          ))}
          {onSetEffort && (
            <>
              <div className="border-t border-border/50" />
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-white/5 cursor-pointer"
                onClick={() => {
                  const idx = effort ? effortLevels.indexOf(effort) : -1;
                  onSetEffort?.(effortLevels[(idx + 1) % effortLevels.length]);
                }}
                title="Click to cycle effort level"
              >
                <span className="text-xs text-text-muted flex items-center gap-3">
                  <span className="w-5 h-5 shrink-0">
                    <EffortIcon />
                  </span>
                  Effort
                  <span className="opacity-70">({effortLabel(effort)})</span>
                </span>
                <EffortSwitch level={effort} levels={effortLevels} onSelect={onSetEffort} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
