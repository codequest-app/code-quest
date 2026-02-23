import type { LocationDef } from '@code-quest/shared';
import { DUNGEON_BOSSES } from '@code-quest/shared';
import { useEffect, useState } from 'react';
import { useMapStore } from '../../stores/mapStore';
import { useMcpStore } from '../../stores/mcpStore';
import { useShopStore } from '../../stores/shopStore';
import { useThemeStore } from '../../stores/themeStore';
import { useWorktreeStore } from '../../stores/worktreeStore';

interface LocationInteriorProps {
  location: LocationDef;
  onExit: () => void;
  onEngageBoss?: (locationId: string) => void;
  onPractice?: () => void;
  onSendMessage?: (message: string) => Promise<string>;
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

const LOCAL_REPLIES = [
  'Interesting question! Let me think about that...',
  'Ah, a fine topic for discussion!',
  'The answer may lie in the wilderness...',
  'Have you tried checking the library?',
  'That reminds me of an old coding tale...',
];

function TavernContent({
  onSendMessage,
}: {
  onSendMessage?: (message: string) => Promise<string>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'bartender', text: 'Welcome! The AI bartender greets you. Ask anything!' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    setMessages((prev) => [...prev, { sender: 'player', text }]);
    setInput('');

    if (onSendMessage) {
      setLoading(true);
      onSendMessage(text).then(
        (reply) => {
          setMessages((prev) => [...prev, { sender: 'bartender', text: reply }]);
          setLoading(false);
        },
        () => {
          setMessages((prev) => [
            ...prev,
            { sender: 'bartender', text: 'Hmm, something went wrong...' },
          ]);
          setLoading(false);
        },
      );
    } else {
      const reply = LOCAL_REPLIES[messages.length % LOCAL_REPLIES.length];
      setMessages((prev) => [...prev, { sender: 'bartender', text: reply }]);
    }
  }

  return (
    <div className="interior-content" data-testid="interior-tavern">
      <div className="tavern-messages" data-testid="tavern-messages">
        {messages.map((msg) => (
          <p key={`${msg.sender}-${msg.text}`} className={`tavern-msg tavern-msg--${msg.sender}`}>
            <strong>{msg.sender === 'bartender' ? '🧙‍♂️' : '🧑'}</strong> {msg.text}
          </p>
        ))}
        {loading && (
          <p className="tavern-msg tavern-msg--bartender" data-testid="tavern-loading">
            <strong>🧙‍♂️</strong> ...
          </p>
        )}
      </div>
      <form className="tavern-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="tavern-input"
          data-testid="tavern-input"
          placeholder="Talk to the bartender..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
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

function ShopDetailContent({ shop, onBack }: { shop: (typeof SHOPS)[number]; onBack: () => void }) {
  const items = useShopStore((s) => s.getShopItems(shop.id));
  const inventory = useShopStore((s) => s.inventory);
  const buyItem = useShopStore((s) => s.buyItem);
  const [buyResult, setBuyResult] = useState<string | null>(null);

  return (
    <div className="interior-content" data-testid="shop-detail">
      <h3>
        {shop.icon} {shop.name}
      </h3>
      <p>{shop.desc}</p>
      {items.length > 0 && (
        <div data-testid="shop-items" className="shop-items">
          {items.map((item) => {
            const owned = inventory.includes(item.id);
            return (
              <div key={item.id} className="shop-item" data-testid={`shop-item-${item.id}`}>
                <span>
                  {item.name} — {item.price}G
                </span>
                <button
                  type="button"
                  className="interior-action-btn"
                  data-testid={`buy-${item.id}`}
                  disabled={owned}
                  onClick={() => {
                    const ok = buyItem(item.id);
                    setBuyResult(ok ? `Purchased ${item.name}!` : 'Not enough gold!');
                  }}
                >
                  {owned ? 'Owned' : 'Buy'}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {buyResult && <p data-testid="shop-buy-result">{buyResult}</p>}
      <button
        type="button"
        className="interior-action-btn"
        data-testid="shop-back-btn"
        onClick={onBack}
      >
        Back to shops
      </button>
    </div>
  );
}

function ShoppingContent() {
  const [activeShop, setActiveShop] = useState<(typeof SHOPS)[number] | null>(null);

  if (activeShop) {
    return <ShopDetailContent shop={activeShop} onBack={() => setActiveShop(null)} />;
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
  const [showSettings, setShowSettings] = useState(false);
  const currentTheme = useThemeStore((s) => s.currentTheme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const themes = useThemeStore((s) => s.themes);

  return (
    <div className="interior-content" data-testid="interior-home">
      {rested ? (
        <p>You are fully rested. HP and MP restored!</p>
      ) : (
        <button type="button" className="interior-action-btn" onClick={() => setRested(true)}>
          Rest (Restore HP/MP)
        </button>
      )}
      {showSettings ? (
        <div data-testid="home-settings-panel">
          <h4>Settings</h4>
          <label>
            Theme:{' '}
            <select
              data-testid="home-theme-select"
              value={currentTheme}
              onChange={(e) => setTheme(e.target.value)}
            >
              {[...themes.keys()].map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="interior-action-btn"
            onClick={() => setShowSettings(false)}
          >
            Close Settings
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="interior-action-btn"
          data-testid="home-settings-btn"
          onClick={() => setShowSettings(true)}
        >
          Settings
        </button>
      )}
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

function LibraryContent() {
  const tools = useMcpStore((s) => s.tools);
  const toggleInstall = useMcpStore((s) => s.toggleInstall);

  return (
    <div className="interior-content" data-testid="interior-library">
      <h3>MCP Tools Library</h3>
      <div data-testid="mcp-tool-list" className="mcp-tool-list">
        {tools.map((tool) => (
          <div key={tool.id} className="mcp-tool-item">
            <div>
              <strong>{tool.name}</strong>
              <p className="mcp-tool-desc">{tool.description}</p>
            </div>
            <button
              type="button"
              className="interior-action-btn"
              data-testid={`mcp-toggle-${tool.id}`}
              onClick={() => toggleInstall(tool.id)}
            >
              {tool.installed ? 'Uninstall' : 'Install'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LocationContent({
  id,
  onEngageBoss,
  onPractice,
  onSendMessage,
}: {
  id: string;
  onEngageBoss?: (locationId: string) => void;
  onPractice?: () => void;
  onSendMessage?: (message: string) => Promise<string>;
}) {
  switch (id) {
    case 'tavern':
      return <TavernContent onSendMessage={onSendMessage} />;
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
          <button
            type="button"
            className="interior-action-btn"
            data-testid="training-practice-btn"
            onClick={() => onPractice?.()}
          >
            Start Practice Battle
          </button>
        </div>
      );
    case 'library':
      return <LibraryContent />;
    case 'bug_cave':
    case 'arch_maze':
    case 'legacy_tomb': {
      const boss = DUNGEON_BOSSES.find((b) => b.dungeonId === id);
      return (
        <div className="interior-content" data-testid="interior-dungeon">
          <h3>{boss ? `${boss.bossIcon} ${boss.bossName}` : 'Boss Chamber'}</h3>
          {boss && (
            <p>
              Lv.{boss.recommendedLevel} — HP {boss.bossHp} — {boss.description}
            </p>
          )}
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
    }
    default:
      return null;
  }
}

export function LocationInterior({
  location,
  onExit,
  onEngageBoss,
  onPractice,
  onSendMessage,
}: LocationInteriorProps) {
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
      <LocationContent
        id={location.id}
        onEngageBoss={onEngageBoss}
        onPractice={onPractice}
        onSendMessage={onSendMessage}
      />
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
