import type { GroupId } from '../contexts/channel';
import { VISIBILITY_GROUPS } from '../contexts/channel';
import { VisibilityGroupRow } from './VisibilityGroupRow';

export const SECTION_LABEL: React.CSSProperties = {
  padding: '6px 16px 2px',
  fontSize: '9px',
  fontFamily: 'monospace',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#4a4a4e',
};

const PILL_BASE: React.CSSProperties = {
  borderRadius: '3px',
  padding: '1px 6px',
  fontSize: '9px',
  fontFamily: 'monospace',
  fontWeight: 700,
  cursor: 'pointer',
};

const PILL_ON: React.CSSProperties = {
  ...PILL_BASE,
  background: '#d97757',
  color: '#fff',
  border: '1px solid #d97757',
};

const PILL_OFF: React.CSSProperties = {
  ...PILL_BASE,
  background: 'none',
  color: '#6a6a6e',
  border: '1px solid #3e3e42',
};

const GROUP_IDS = VISIBILITY_GROUPS.map((g) => g.id) as GroupId[];

interface FiltersProps {
  flat?: boolean;
  onPartialClick?: (groupId: GroupId) => void;
}

export function FiltersSection({ flat = false, onPartialClick }: FiltersProps) {
  return (
    <div>
      <div style={SECTION_LABEL}>Message Visibility</div>
      {GROUP_IDS.map((id) => (
        <VisibilityGroupRow
          key={id}
          groupId={id}
          flat={flat}
          onPartialClick={onPartialClick ? () => onPartialClick(id) : undefined}
        />
      ))}
    </div>
  );
}

interface PanelsProps {
  onToggleRawPanel?: () => void;
  rawPanelActive?: boolean;
}

export function PanelsSection({ onToggleRawPanel, rawPanelActive = false }: PanelsProps) {
  return (
    <div>
      <div style={SECTION_LABEL}>Panels</div>
      <button
        type="button"
        onClick={onToggleRawPanel}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '4px 16px',
          gap: '8px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#cccccc', flex: 1 }}>
          Raw Event Panel
        </span>
        <span
          data-testid="raw-panel-toggle"
          data-active={String(rawPanelActive)}
          style={rawPanelActive ? PILL_ON : PILL_OFF}
        >
          {rawPanelActive ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  );
}

interface ActionsTabProps {
  flat?: boolean;
  onToggleRawPanel?: () => void;
  rawPanelActive?: boolean;
}

export function ActionsTab({
  flat = false,
  onToggleRawPanel,
  rawPanelActive = false,
}: ActionsTabProps) {
  return (
    <div>
      <FiltersSection flat={flat} />
      <PanelsSection onToggleRawPanel={onToggleRawPanel} rawPanelActive={rawPanelActive} />
    </div>
  );
}
