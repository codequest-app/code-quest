import { useEffect, useRef, useState } from 'react';
import { useChannelConfig } from '../contexts/channel';
import { EffortSwitch, effortLabel } from './icons/EffortSwitch';
import {
  AskBeforeEditsSmallIcon,
  CheckIcon,
  EffortIcon,
  PERMISSION_MODE_ICONS,
} from './icons/PermissionModeIcons';

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
      id: 'bypassPermissions',
      label: 'Bypass permissions',
      title: `${brandName} Code will not ask for your approval before running potentially dangerous commands.`,
      description: `${brandName} will not ask for approval before running potentially dangerous commands`,
    },
  ];
}

const DEFAULT_MODES = getPermissionModes('Claude');
const DEFAULT_MODE = DEFAULT_MODES[0];

export const PERMISSION_MODE_IDS = ['normal', 'acceptEdits', 'plan', 'bypassPermissions'] as const;
export type PermissionModeId = (typeof PERMISSION_MODE_IDS)[number];

export interface PermissionModePickerProps {
  mode: string;
  effort?: string;
  onSetPermissionMode?: (mode: string) => void;
  onSetEffort?: (effort: string) => void;
}

export function PermissionModePicker({
  mode,
  effort = 'max',
  onSetPermissionMode,
  onSetEffort,
}: PermissionModePickerProps) {
  const { providerConfig } = useChannelConfig();
  const brandName = providerConfig?.brand.name ?? 'Claude';
  const configModes = providerConfig?.permissionModes;
  const permissionModes = configModes?.length
    ? configModes.map((m) => ({
        ...m,
        title: `${m.description}. Click, or press Shift+Tab, to switch modes.`,
      }))
    : getPermissionModes(brandName);
  const permissionById = Object.fromEntries(permissionModes.map((m) => [m.id, m]));

  const [showModePicker, setShowModePicker] = useState(false);
  const modePickerRef = useRef<HTMLDivElement>(null);
  const modeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showModePicker) return;
    const handleClick = (e: MouseEvent) => {
      if (
        !modePickerRef.current?.contains(e.target as Node) &&
        !modeButtonRef.current?.contains(e.target as Node)
      ) {
        setShowModePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showModePicker]);

  return (
    <div className="relative">
      <button
        ref={modeButtonRef}
        type="button"
        title={(permissionById[mode] ?? DEFAULT_MODE).title}
        onClick={() => setShowModePicker((v) => !v)}
        className="permission-mode-btn text-[0.85em] bg-transparent border-none cursor-pointer shrink-0 flex items-center gap-[4px] px-[4px] py-[2px] rounded-[2px] hover:bg-white/5"
      >
        <span className="w-5 h-5 flex-shrink-0">
          {(PERMISSION_MODE_ICONS as Record<string, { smallIcon: React.ReactNode }>)[mode]
            ?.smallIcon ?? <AskBeforeEditsSmallIcon />}
        </span>
        <span>{(permissionById[mode] ?? DEFAULT_MODE).label}</span>
      </button>
      {showModePicker && (
        <div
          ref={modePickerRef}
          className="absolute bottom-full right-0 mb-1 bg-surface border border-border rounded-lg shadow-lg z-50 min-w-[280px] py-1"
        >
          <div className="px-3 py-1.5 text-[11px] text-text-muted flex items-center justify-between">
            <span className="font-semibold">Modes</span>
            <span className="opacity-60 flex items-center gap-1">
              <kbd className="bg-white/10 rounded px-1 text-[10px]">⇧</kbd> +{' '}
              <kbd className="bg-white/10 rounded px-1 text-[10px]">tab</kbd> to switch
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
              className={`w-full text-left px-3 py-2 flex items-start gap-2 cursor-pointer transition-colors ${m.id === mode ? 'bg-selected text-white' : 'hover:bg-white/5'}`}
            >
              <span className="w-5 h-5 flex-shrink-0 mt-0.5">
                {(PERMISSION_MODE_ICONS as Record<string, { icon: React.ReactNode }>)[m.id]?.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium">{m.label}</div>
                <div className="text-[11px] opacity-70">{m.description}</div>
              </div>
              {m.id === mode && (
                <span className="mt-0.5">
                  <CheckIcon />
                </span>
              )}
            </button>
          ))}
          {onSetEffort && (
            <>
              <div className="border-t border-border/50" />
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-white/5 cursor-pointer"
                onClick={() => {
                  const levels = ['low', 'medium', 'high', 'max'];
                  const idx = effort ? levels.indexOf(effort) : -1;
                  onSetEffort?.(levels[(idx + 1) % levels.length]);
                }}
                title="Click to cycle effort level"
              >
                <span className="text-[13px] text-text-muted flex items-center gap-1.5">
                  <span className="w-5 h-5 flex-shrink-0">
                    <EffortIcon />
                  </span>
                  Effort
                  <span className="opacity-70">({effortLabel(effort)})</span>
                </span>
                <EffortSwitch
                  level={effort}
                  levels={['low', 'medium', 'high', 'max']}
                  onSelect={(l) => onSetEffort(l as 'low' | 'medium' | 'high' | 'max')}
                />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
