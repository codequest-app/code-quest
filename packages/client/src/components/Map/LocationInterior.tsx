import type { LocationDef } from '@code-quest/shared';
import { useEffect, useState } from 'react';
import { useMapStore } from '../../stores/mapStore';
import { useWorktreeStore } from '../../stores/worktreeStore';

interface LocationInteriorProps {
  location: LocationDef;
  onExit: () => void;
  onEngageBoss?: (locationId: string) => void;
}

const SHOPS = [
  {
    id: 'skills',
    icon: '🔮',
    name: 'Skills Shop',
    desc: 'Browse and purchase new coding skills. Unlock abilities like auto-complete, refactor, and debug.',
  },
  {
    id: 'forge',
    icon: '⚒️',
    name: 'Skill Forge',
    desc: 'Upgrade and combine existing skills to create powerful new techniques.',
  },
  {
    id: 'mcp-library',
    icon: '📚',
    name: 'MCP Tools Library',
    desc: 'Install and manage MCP tool servers. Extend your capabilities with external integrations.',
  },
  {
    id: 'subagent',
    icon: '🧙',
    name: 'Subagent Guild',
    desc: 'Recruit AI subagents to assist with parallel tasks. Manage your team of helpers.',
  },
  {
    id: 'treasury',
    icon: '🏆',
    name: 'Treasury',
    desc: 'View your achievements, earned rewards, and collected trophies from completed quests.',
  },
  {
    id: 'training',
    icon: '🎯',
    name: 'Training Ground',
    desc: 'Practice skills in a safe environment. Run test battles without consuming resources.',
  },
  {
    id: 'bank',
    icon: '💰',
    name: 'Bank',
    desc: 'Deposit and withdraw gold. Manage your finances and invest in upgrades.',
  },
];

interface ChatMessage {
  sender: 'bartender' | 'player';
  text: string;
}

function TavernContent() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'bartender', text: 'Welcome! The AI bartender greets you. Ask anything!' },
  ]);
  const [input, setInput] = useState('');

  const REPLIES = [
    'Interesting question! Let me think about that...',
    'Ah, a fine topic for discussion!',
    'The answer may lie in the wilderness...',
    'Have you tried checking the library?',
    'That reminds me of an old coding tale...',
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const reply = REPLIES[messages.length % REPLIES.length];
    setMessages((prev) => [
      ...prev,
      { sender: 'player', text: input.trim() },
      { sender: 'bartender', text: reply },
    ]);
    setInput('');
  }

  return (
    <div className="interior-content" data-testid="interior-tavern">
      <div className="tavern-messages" data-testid="tavern-messages">
        {messages.map((msg) => (
          <p key={`${msg.sender}-${msg.text}`} className={`tavern-msg tavern-msg--${msg.sender}`}>
            <strong>{msg.sender === 'bartender' ? '🧙‍♂️' : '🧑'}</strong> {msg.text}
          </p>
        ))}
      </div>
      <form className="tavern-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="tavern-input"
          data-testid="tavern-input"
          placeholder="Talk to the bartender..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </form>
    </div>
  );
}

function StasisContent() {
  const planActive = useMapStore((s) => s.planModeActive);
  const setPlanMode = useMapStore((s) => s.setPlanMode);

  if (planActive) {
    return (
      <div className="interior-content" data-testid="interior-stasis">
        <div data-testid="stasis-plan-active">
          <h3>Plan Mode Active</h3>
          <p>Time is frozen. Think deeply and plan your approach.</p>
          <textarea className="stasis-textarea" placeholder="Write your plan here..." rows={6} />
          <button
            type="button"
            className="interior-action-btn"
            data-testid="stasis-exit-plan-btn"
            onClick={() => setPlanMode(false)}
          >
            Exit Plan Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="interior-content" data-testid="interior-stasis">
      <p>Time freezes here. Enter Plan Mode to think deeply.</p>
      <button
        type="button"
        className="interior-action-btn"
        data-testid="stasis-plan-btn"
        onClick={() => setPlanMode(true)}
      >
        Enter Plan Mode
      </button>
    </div>
  );
}

function ShoppingContent() {
  const [activeShop, setActiveShop] = useState<(typeof SHOPS)[number] | null>(null);

  if (activeShop) {
    return (
      <div className="interior-content" data-testid="shop-detail">
        <h3>
          {activeShop.icon} {activeShop.name}
        </h3>
        <p>{activeShop.desc}</p>
        <button
          type="button"
          className="interior-action-btn"
          data-testid="shop-back-btn"
          onClick={() => setActiveShop(null)}
        >
          Back to shops
        </button>
      </div>
    );
  }

  return (
    <div className="interior-content" data-testid="interior-shopping">
      <div className="interior-shops">
        {SHOPS.map((shop) => (
          <button
            key={shop.id}
            type="button"
            className="interior-shop-btn"
            data-testid={`shop-${shop.id}`}
            onClick={() => setActiveShop(shop)}
          >
            <span>{shop.icon}</span> {shop.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function PlayerHomeContent() {
  const [rested, setRested] = useState(false);
  return (
    <div className="interior-content" data-testid="interior-home">
      {rested ? (
        <p>You are fully rested. HP and MP restored!</p>
      ) : (
        <button type="button" className="interior-action-btn" onClick={() => setRested(true)}>
          Rest (Restore HP/MP)
        </button>
      )}
      <button type="button" className="interior-action-btn">
        Settings
      </button>
    </div>
  );
}

function GuildHallContent() {
  const worktrees = useWorktreeStore((s) => s.worktrees);
  const addWorktree = useWorktreeStore((s) => s.addWorktree);
  const removeWorktree = useWorktreeStore((s) => s.removeWorktree);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBranch, setNewBranch] = useState('');

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newBranch.trim()) return;
    addWorktree(newName.trim(), newBranch.trim());
    setNewName('');
    setNewBranch('');
    setShowCreate(false);
  }

  const STATUS_ICON: Record<string, string> = { stable: '🏰', active: '⚔️', idle: '💤' };

  return (
    <div className="interior-content" data-testid="interior-guild">
      <h3>Worktree Management Center</h3>
      <div className="guild-worktree-list" data-testid="guild-worktree-list">
        {worktrees.map((w) => (
          <div key={w.name} className="guild-worktree-item" data-testid={`worktree-${w.name}`}>
            <span>{STATUS_ICON[w.status] ?? '❓'}</span> {w.name} — {w.status}
            {w.name !== 'main' && (
              <button
                type="button"
                className="guild-remove-btn"
                data-testid={`worktree-remove-${w.name}`}
                onClick={() => removeWorktree(w.name)}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      {showCreate ? (
        <form data-testid="guild-create-form" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Name"
            data-testid="guild-name-input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Branch"
            data-testid="guild-branch-input"
            value={newBranch}
            onChange={(e) => setNewBranch(e.target.value)}
          />
          <button type="submit" className="interior-action-btn" data-testid="guild-submit-btn">
            Create
          </button>
          <button
            type="button"
            className="interior-action-btn"
            onClick={() => setShowCreate(false)}
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          className="interior-action-btn"
          data-testid="guild-create-btn"
          onClick={() => setShowCreate(true)}
        >
          Create New Timeline
        </button>
      )}
    </div>
  );
}

function LocationContent({
  id,
  onEngageBoss,
}: {
  id: string;
  onEngageBoss?: (locationId: string) => void;
}) {
  switch (id) {
    case 'tavern':
      return <TavernContent />;
    case 'shopping_district':
      return <ShoppingContent />;
    case 'stasis_chamber':
      return <StasisContent />;
    case 'guild_hall':
      return <GuildHallContent />;
    case 'player_home':
      return <PlayerHomeContent />;
    case 'training_ground':
      return (
        <div className="interior-content" data-testid="interior-training">
          <p>Practice and test skills without consuming resources.</p>
        </div>
      );
    case 'library':
      return (
        <div className="interior-content" data-testid="interior-library">
          <p>Browse and install MCP tools and extensions.</p>
        </div>
      );
    case 'bug_cave':
    case 'arch_maze':
    case 'legacy_tomb':
      return (
        <div className="interior-content" data-testid="interior-dungeon">
          <h3>Boss Chamber</h3>
          <p>A powerful enemy awaits. Prepare yourself.</p>
          <button
            type="button"
            className="interior-action-btn"
            data-testid="dungeon-engage-btn"
            onClick={() => onEngageBoss?.(id)}
          >
            Engage Boss
          </button>
        </div>
      );
    default:
      return null;
  }
}

export function LocationInterior({ location, onExit, onEngageBoss }: LocationInteriorProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onExit();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  return (
    <div className="location-interior" data-testid="location-interior">
      <div className="location-interior__header">
        <span className="location-interior__icon">{location.icon}</span>
        <h2 className="location-interior__name">{location.name}</h2>
      </div>
      <p className="location-interior__description">{location.description}</p>
      <LocationContent id={location.id} onEngageBoss={onEngageBoss} />
      <button
        type="button"
        className="location-interior__exit"
        data-testid="location-exit-btn"
        onClick={onExit}
      >
        ← Exit
      </button>
    </div>
  );
}
