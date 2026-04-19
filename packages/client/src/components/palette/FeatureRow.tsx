import { useState } from 'react';
import { toPaletteCommand } from '../../lib/adapters/to-palette-command';
import { deriveGroupAggregate, type Feature } from '../../lib/feature';
import { cn } from '../../utils/cn';

export interface FeatureRowProps {
  feature: Feature;
  isActive: boolean;
  onActiveChange: (id: string | null) => void;
  onExecute?: (feature: Feature) => void;
}

function FlatRow({ feature, isActive, onActiveChange, onExecute }: FeatureRowProps) {
  const cmd = toPaletteCommand(feature);
  return (
    <button
      type="button"
      data-active={isActive || undefined}
      onMouseEnter={() => onActiveChange(feature.id)}
      onClick={() => (onExecute ? onExecute(feature) : feature.execute())}
      disabled={feature.disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        width: '100%',
        padding: '8px 16px',
        background: isActive ? 'rgba(217,119,87,0.07)' : 'transparent',
        border: 'none',
        borderLeft: `2px solid ${isActive ? '#d97757' : 'transparent'}`,
        cursor: feature.disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        transition: 'background 0.1s',
        opacity: feature.disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          fontSize: '13px',
          color: '#ccc',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {cmd.label}
      </span>
      {cmd.trailing && (
        // biome-ignore lint/a11y/noStaticElementInteractions: wrapper only stops propagation
        <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          {cmd.trailing}
        </span>
      )}
    </button>
  );
}

type GroupState = Extract<NonNullable<Feature['state']>, { kind: 'group' }>;

function GroupRow({ feature, groupState }: { feature: Feature; groupState: GroupState }) {
  const [expanded, setExpanded] = useState(false);
  const agg = deriveGroupAggregate(groupState.items);

  const handleAggToggle = () => {
    if (agg === 'partial' && groupState.onPartial) {
      groupState.onPartial();
      return;
    }
    // all-on → toggle every item off; all-off → toggle every item on
    for (const item of groupState.items) item.toggle();
  };

  return (
    <div data-testid={`group-row-${feature.id}`} data-state={agg} className="px-4 py-0.5">
      <div className="flex items-center h-8 gap-2">
        <button
          type="button"
          data-testid="group-label"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 flex-1 bg-transparent border-0 text-left p-0 text-xs font-mono cursor-pointer',
            agg === 'none' ? 'text-text-muted' : 'text-text',
          )}
        >
          <span>{feature.label}</span>
        </button>
        <button
          type="button"
          data-testid="group-toggle"
          data-state={agg}
          onClick={(e) => {
            e.stopPropagation();
            handleAggToggle();
          }}
          className={cn(
            'text-[9px] font-mono font-bold tracking-[0.05em] rounded-[3px] px-1.5 py-0.5 cursor-pointer shrink-0 border',
            agg === 'all' && 'bg-accent text-white border-accent',
            agg === 'none' && 'text-text-muted border-border',
            agg === 'partial' && 'text-warning border-warning',
          )}
        >
          {agg === 'all' ? 'ON' : agg === 'none' ? 'OFF' : '∂'}
        </button>
      </div>
      {expanded && groupState.items.length > 0 && (
        <div className="pb-1.5 pl-5">
          {groupState.items.map((item) => (
            <div
              key={item.value}
              data-testid={`type-row-${item.value}`}
              className="flex items-center gap-2 h-7"
            >
              <span
                className={cn(
                  'text-[11px] font-mono shrink-0 w-36 overflow-hidden text-ellipsis whitespace-nowrap',
                  item.on ? 'text-text' : 'text-text-muted',
                )}
              >
                {item.label}
              </span>
              <span
                data-testid={`type-sample-${item.value}`}
                className="text-[10px] font-mono text-text-muted flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
              >
                {item.preview ?? ''}
              </span>
              <button
                type="button"
                data-testid={`type-pill-${item.value}`}
                onClick={(e) => {
                  e.stopPropagation();
                  item.toggle();
                }}
                className={cn(
                  'text-[9px] font-mono font-bold tracking-[0.05em] rounded-[3px] px-1.5 py-0.5 cursor-pointer shrink-0 border',
                  item.on ? 'bg-accent text-white border-accent' : 'text-text-muted border-border',
                )}
              >
                {item.on ? 'ON' : 'OFF'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FeatureRow(props: FeatureRowProps) {
  const state = props.feature.state;
  if (state?.kind === 'group') {
    return <GroupRow feature={props.feature} groupState={state} />;
  }
  return <FlatRow {...props} />;
}
