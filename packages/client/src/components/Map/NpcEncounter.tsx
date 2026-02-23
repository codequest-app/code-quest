export interface NpcData {
  name: string;
  icon: string;
  dialogue: string;
}

interface NpcEncounterProps {
  npc: NpcData;
  onDismiss: () => void;
}

export const WANDERING_NPCS: NpcData[] = [
  { name: 'Wandering Sage', icon: '🧙', dialogue: 'Beware of the volcano region, young coder.' },
  {
    name: 'Lost Traveler',
    icon: '🧳',
    dialogue: 'I once found a rare skill scroll in the mountains.',
  },
  {
    name: 'Forest Spirit',
    icon: '🌿',
    dialogue: 'The forest holds secrets for those who read carefully.',
  },
  { name: 'Old Knight', icon: '🛡️', dialogue: 'Always write tests before you charge into battle.' },
  { name: 'Merchant Cat', icon: '🐱', dialogue: 'Meow... I mean, check the shops for deals!' },
];

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
