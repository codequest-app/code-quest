import type { MapNpcData } from '../../stores/mapStore';

interface NpcEncounterProps {
  npc: MapNpcData;
  onDismiss: () => void;
}

export function NpcEncounter({ npc, onDismiss }: NpcEncounterProps) {
  return (
    <div className="npc-encounter" data-testid="npc-encounter">
      <div className="npc-encounter__header">
        <span className="npc-encounter__icon">{npc.icon}</span>
        <strong>{npc.name}</strong>
      </div>
      <p className="npc-encounter__dialogue">{npc.dialogue}</p>
      <button
        type="button"
        className="interior-action-btn"
        data-testid="npc-dismiss-btn"
        onClick={onDismiss}
      >
        OK
      </button>
    </div>
  );
}
