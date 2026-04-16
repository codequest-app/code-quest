import { useState } from 'react';
import { useChannelMessages, useMessageVisibility } from '../contexts/channel';
import {
  type GroupId,
  type GroupState,
  OTHER_GROUP_ICON,
  VISIBILITY_GROUPS,
} from '../contexts/channel/MessageVisibilityContext';
import type { Message } from '../types/ui';
import { cn } from '../utils/cn';
import { messagePreview } from '../utils/isMessageVisible';

interface Props {
  groupId: GroupId;
  flat?: boolean;
  onPartialClick?: () => void;
}

function groupPillClass(state: GroupState): string {
  if (state === 'all') return 'bg-accent/90 text-white border-transparent';
  if (state === 'partial') return 'bg-transparent text-accent border-accent';
  return 'bg-white/[0.06] text-text-muted border-transparent';
}

function pillLabel(state: GroupState) {
  if (state === 'all') return 'ON';
  if (state === 'partial') return '∂';
  return 'OFF';
}

function typePillClass(on: boolean): string {
  return on
    ? 'bg-accent/90 text-white border-transparent'
    : 'bg-white/[0.06] text-text-muted border-transparent';
}

interface ExpandedTypesProps {
  types: string[];
  messages: Message[];
  enabledTypes: Set<string>;
  toggleType: (type: string) => void;
}

function ExpandedTypes({ types, messages, enabledTypes, toggleType }: ExpandedTypesProps) {
  const latestSampleByType = new Map<string, string>();
  for (const m of messages) latestSampleByType.set(m.type, messagePreview(m));

  return (
    <div className="pb-1.5 pl-5">
      {types.map((type) => {
        const on = enabledTypes.has(type);
        const sample = (latestSampleByType.get(type) ?? '').slice(0, 40);
        return (
          <div key={type} data-testid={`type-row-${type}`} className="flex items-center gap-2 h-7">
            <span
              className={cn(
                'text-[11px] font-mono shrink-0 w-36 overflow-hidden text-ellipsis whitespace-nowrap',
                on ? 'text-text' : 'text-text-muted',
              )}
            >
              {type}
            </span>

            <span
              data-testid={`type-sample-${type}`}
              className="text-[10px] font-mono text-text-muted flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {sample}
            </span>

            <button
              type="button"
              data-testid={`type-pill-${type}`}
              onClick={() => toggleType(type)}
              className={cn(
                'text-[9px] font-mono font-bold tracking-[0.05em] rounded-[3px] px-1.5 py-0.5 cursor-pointer shrink-0 border',
                typePillClass(on),
              )}
            >
              {on ? 'ON' : 'OFF'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function VisibilityGroupRow({ groupId, flat = false, onPartialClick }: Props) {
  const { toggleGroup, toggleType, groupState, enabledTypes, unknownTypes } =
    useMessageVisibility();
  const { messages } = useChannelMessages();
  const [expanded, setExpanded] = useState(false);

  const state = groupState(groupId);

  const group =
    groupId === 'other'
      ? { id: 'other' as GroupId, label: '其他', icon: OTHER_GROUP_ICON, types: [...unknownTypes] }
      : VISIBILITY_GROUPS.find((g) => g.id === groupId);

  if (!group) return null;

  const Icon = group.icon;
  const types = group.types;

  const handleLabelClick = () => {
    if (!flat) setExpanded((v) => !v);
  };

  const handleToggleClick = () => {
    if (state === 'partial' && onPartialClick) {
      onPartialClick();
      return;
    }
    toggleGroup(groupId);
  };

  return (
    <div data-testid={`group-row-${groupId}`} data-state={state} className="px-4 py-0.5">
      <div className="flex items-center h-8 gap-2">
        <button
          type="button"
          data-testid="group-label"
          onClick={handleLabelClick}
          className={cn(
            'flex items-center gap-1.5 flex-1 bg-transparent border-0 text-left p-0 text-xs font-mono',
            flat ? 'cursor-default' : 'cursor-pointer',
            state === 'none' ? 'text-text-muted' : 'text-text',
          )}
        >
          <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{group.label}</span>
        </button>

        <button
          type="button"
          data-testid="group-toggle"
          onClick={handleToggleClick}
          className={cn(
            'text-[9px] font-mono font-bold tracking-[0.05em] rounded-[3px] px-1.5 py-0.5 cursor-pointer shrink-0 border',
            groupPillClass(state),
          )}
        >
          {pillLabel(state)}
        </button>
      </div>

      {!flat && expanded && types.length > 0 && (
        <ExpandedTypes
          types={types}
          messages={messages}
          enabledTypes={enabledTypes}
          toggleType={toggleType}
        />
      )}
    </div>
  );
}
