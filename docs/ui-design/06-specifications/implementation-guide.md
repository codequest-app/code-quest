# 實作指南 (Implementation Guide)

## Overview

This comprehensive guide provides step-by-step instructions for implementing the Cultivation Clicker design system. It covers technology stack recommendations, project structure, component implementation, state management, and deployment strategies.

**Purpose**: Transform design documentation into a working application

【參考：01-design-system/】【參考：04-components/】

---

## Technology Stack

### Recommended Frontend Framework

**Option 1: React** (Recommended)
- **Pros**: Large ecosystem, extensive component libraries, excellent tooling
- **Cons**: Learning curve for beginners
- **Best for**: Complex state management, large team projects

**Option 2: Vue.js**
- **Pros**: Gentle learning curve, excellent documentation, intuitive API
- **Cons**: Smaller ecosystem than React
- **Best for**: Rapid development, smaller teams

**Option 3: Vanilla JavaScript**
- **Pros**: No framework overhead, full control, lightweight
- **Cons**: More boilerplate code, manual DOM management
- **Best for**: Small projects, learning projects, maximum performance

### CSS Methodology

**Option 1: CSS Modules** (Recommended with React/Vue)
```css
/* Button.module.css */
.button {
  padding: 12px 24px;
  border-radius: 4px;
}

.button--primary {
  background: var(--color-primary);
}
```

```javascript
import styles from './Button.module.css';

<button className={styles.button}>Click me</button>
```

**Option 2: BEM (Block Element Modifier)**
```css
/* button.css */
.button { }
.button__icon { }
.button--primary { }
.button--large { }
```

**Option 3: Styled Components** (CSS-in-JS)
```javascript
import styled from 'styled-components';

const Button = styled.button`
  padding: 12px 24px;
  background: ${props => props.primary ? 'var(--color-primary)' : 'transparent'};
`;
```

**Option 4: Tailwind CSS**
```html
<button class="px-6 py-3 bg-blue-500 rounded hover:bg-blue-600">
  Click me
</button>
```

**Recommendation**: CSS Modules for component scoping + BEM for clarity

### Build Tools

**Vite** (Recommended)
- Ultra-fast HMR (Hot Module Replacement)
- Modern ES modules
- Built-in TypeScript support
- Simple configuration

```bash
npm create vite@latest cultivation-clicker -- --template react
```

**Webpack** (Alternative)
- Highly configurable
- Mature ecosystem
- More complex setup

**Parcel** (Zero-config option)
- No configuration needed
- Fast bundling
- Good for small projects

### Testing Tools

**Unit Testing**: Vitest (with Vite) or Jest
```javascript
import { render, screen } from '@testing-library/react';
import Button from './Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

**E2E Testing**: Playwright (Recommended) or Cypress
```javascript
test('can complete a battle', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('.skill-button--attack');
  await expect(page.locator('.battle-log')).toContainText('攻擊成功');
});
```

**Component Testing**: Storybook
```javascript
export default {
  title: 'Components/Button',
  component: Button,
};

export const Primary = () => <Button variant="primary">Primary</Button>;
export const Secondary = () => <Button variant="secondary">Secondary</Button>;
```

---

## Project Structure

### Recommended Folder Structure

```
cultivation-clicker/
├── public/                      # Static assets
│   ├── fonts/
│   ├── images/
│   └── favicon.ico
├── src/
│   ├── components/              # Reusable components
│   │   ├── atoms/               # Basic components
│   │   │   ├── Button/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Button.module.css
│   │   │   │   └── Button.test.jsx
│   │   │   ├── Icon/
│   │   │   ├── Input/
│   │   │   └── Badge/
│   │   ├── molecules/           # Compound components
│   │   │   ├── StatusBar/
│   │   │   ├── SkillButton/
│   │   │   └── ProgressBar/
│   │   └── organisms/           # Complex components
│   │       ├── CharacterPanel/
│   │       ├── BattleLog/
│   │       └── InventoryGrid/
│   ├── screens/                 # Full screen views
│   │   ├── HomeScreen/
│   │   ├── BattleScreen/
│   │   ├── InventoryScreen/
│   │   └── ShopScreen/
│   ├── layouts/                 # Layout components
│   │   ├── MainLayout/
│   │   └── BattleLayout/
│   ├── hooks/                   # Custom React hooks
│   │   ├── useCharacter.js
│   │   ├── useBattle.js
│   │   └── useInventory.js
│   ├── stores/                  # State management
│   │   ├── characterStore.js
│   │   ├── battleStore.js
│   │   └── inventoryStore.js
│   ├── services/                # API services
│   │   ├── api.js
│   │   ├── battleService.js
│   │   └── saveService.js
│   ├── utils/                   # Utility functions
│   │   ├── calculations.js
│   │   ├── formatters.js
│   │   └── validators.js
│   ├── constants/               # Constants and config
│   │   ├── gameConfig.js
│   │   ├── routes.js
│   │   └── skillData.js
│   ├── styles/                  # Global styles
│   │   ├── variables.css        # CSS variables
│   │   ├── reset.css            # CSS reset
│   │   ├── typography.css       # Typography
│   │   └── animations.css       # Global animations
│   ├── assets/                  # Asset files
│   │   ├── images/
│   │   ├── sprites/
│   │   └── sounds/
│   ├── types/                   # TypeScript types (if using TS)
│   │   ├── character.ts
│   │   ├── battle.ts
│   │   └── inventory.ts
│   ├── App.jsx                  # Root component
│   ├── main.jsx                 # Entry point
│   └── router.jsx               # Route configuration
├── docs/                        # Documentation
├── tests/                       # E2E tests
│   ├── battle.spec.js
│   └── inventory.spec.js
├── .env                         # Environment variables
├── .gitignore
├── package.json
├── vite.config.js              # Vite configuration
└── README.md
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `Button.jsx`, `CharacterPanel.jsx`)
- **Utilities**: camelCase (e.g., `formatNumber.js`, `calculateDamage.js`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_LEVEL.js`)
- **CSS Modules**: ComponentName.module.css (e.g., `Button.module.css`)
- **Tests**: ComponentName.test.jsx (e.g., `Button.test.jsx`)

---

## Component Implementation

【參考：04-components/】

### Step 1: Set Up Design Tokens

Create CSS variables for consistent styling:

```css
/* src/styles/variables.css */

:root {
  /* Colors */
  --color-primary: #4A90E2;
  --color-primary-hover: #357ABD;
  --color-secondary: #50C878;
  --color-danger: #E74C3C;
  --color-warning: #F39C12;
  --color-success: #27AE60;

  --color-text-primary: #FFFFFF;
  --color-text-secondary: #B0B0B0;
  --color-text-disabled: #666666;

  --color-bg-primary: #1A1A1A;
  --color-bg-secondary: #2A2A2A;
  --color-bg-tertiary: #3A3A3A;

  --color-hp: #4CAF50;
  --color-mp: #2196F3;
  --color-exp: #FFC107;

  --color-border: #3A3A3A;
  --color-border-hover: #4A4A4A;

  /* Typography */
  --font-family-base: 'Noto Sans TC', -apple-system, sans-serif;
  --font-family-mono: 'Press Start 2P', monospace;

  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 32px;

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;

  --line-height-tight: 1.2;
  --line-height-base: 1.5;
  --line-height-relaxed: 1.75;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.4);

  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-base: 200ms ease-out;
  --transition-slow: 300ms ease-out;

  /* Z-index */
  --z-dropdown: 1000;
  --z-modal: 1100;
  --z-tooltip: 1200;
  --z-notification: 1300;

  /* Breakpoints */
  --breakpoint-tablet: 768px;
  --breakpoint-desktop: 1200px;
  --breakpoint-large: 1920px;
}
```

### Step 2: Create Base Components

**Example: Button Component**

```jsx
// src/components/atoms/Button/Button.jsx
import React from 'react';
import styles from './Button.module.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  ...props
}) => {
  const classNames = [
    styles.button,
    styles[`button--${variant}`],
    styles[`button--${size}`],
    fullWidth && styles['button--full-width'],
    disabled && styles['button--disabled'],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classNames}
      onClick={onClick}
      disabled={disabled}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
```

```css
/* src/components/atoms/Button/Button.module.css */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  white-space: nowrap;
  user-select: none;
}

/* Variants */
.button--primary {
  background: var(--color-primary);
  color: var(--color-text-primary);
  border-color: var(--color-primary);
}

.button--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.button--secondary {
  background: transparent;
  color: var(--color-text-primary);
  border-color: var(--color-border);
}

.button--secondary:hover:not(:disabled) {
  background: var(--color-bg-secondary);
  border-color: var(--color-border-hover);
}

.button--danger {
  background: var(--color-danger);
  color: var(--color-text-primary);
  border-color: var(--color-danger);
}

/* Sizes */
.button--small {
  padding: 6px 12px;
  font-size: var(--font-size-sm);
}

.button--medium {
  padding: 10px 20px;
  font-size: var(--font-size-base);
}

.button--large {
  padding: 14px 28px;
  font-size: var(--font-size-lg);
}

/* States */
.button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button--full-width {
  width: 100%;
}

.button:active:not(:disabled) {
  transform: translateY(0);
}
```

### Step 3: Build Compound Components

**Example: Status Bar Component**

```jsx
// src/components/molecules/StatusBar/StatusBar.jsx
import React from 'react';
import ProgressBar from '../../atoms/ProgressBar/ProgressBar';
import styles from './StatusBar.module.css';

const StatusBar = ({
  avatar,
  name,
  level,
  hp,
  maxHp,
  mp,
  maxMp
}) => {
  const hpPercent = (hp / maxHp) * 100;
  const mpPercent = (mp / maxMp) * 100;

  return (
    <div className={styles.statusBar}>
      <div className={styles.statusBar__header}>
        <img
          src={avatar}
          alt={name}
          className={styles.statusBar__avatar}
        />
        <div className={styles.statusBar__info}>
          <h3 className={styles.statusBar__name}>{name}</h3>
          <p className={styles.statusBar__level}>Lv. {level}</p>
        </div>
      </div>

      <div className={styles.statusBar__stats}>
        <ProgressBar
          label="HP"
          current={hp}
          max={maxHp}
          percent={hpPercent}
          color="hp"
        />
        <ProgressBar
          label="MP"
          current={mp}
          max={maxMp}
          percent={mpPercent}
          color="mp"
        />
      </div>
    </div>
  );
};

export default StatusBar;
```

### Step 4: Compose Screens

```jsx
// src/screens/BattleScreen/BattleScreen.jsx
import React from 'react';
import StatusBar from '../../components/molecules/StatusBar/StatusBar';
import BattleLog from '../../components/organisms/BattleLog/BattleLog';
import SkillGrid from '../../components/organisms/SkillGrid/SkillGrid';
import { useBattle } from '../../hooks/useBattle';
import styles from './BattleScreen.module.css';

const BattleScreen = () => {
  const {
    player,
    enemy,
    battleLog,
    skills,
    handleSkillUse,
    isPlayerTurn,
  } = useBattle();

  return (
    <div className={styles.battleScreen}>
      <div className={styles.battleScreen__player}>
        <StatusBar
          avatar={player.avatar}
          name={player.name}
          level={player.level}
          hp={player.hp}
          maxHp={player.maxHp}
          mp={player.mp}
          maxMp={player.maxMp}
        />
      </div>

      <div className={styles.battleScreen__enemy}>
        <StatusBar
          avatar={enemy.avatar}
          name={enemy.name}
          level={enemy.level}
          hp={enemy.hp}
          maxHp={enemy.maxHp}
          mp={enemy.mp}
          maxMp={enemy.maxMp}
        />
      </div>

      <div className={styles.battleScreen__log}>
        <BattleLog entries={battleLog} />
      </div>

      <div className={styles.battleScreen__skills}>
        <SkillGrid
          skills={skills}
          onSkillClick={handleSkillUse}
          disabled={!isPlayerTurn}
        />
      </div>
    </div>
  );
};

export default BattleScreen;
```

---

## State Management

【參考：03-flows/】

### Local State (useState)

For component-specific state:

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

### Global State (Context API)

For app-wide state:

```jsx
// src/stores/CharacterContext.jsx
import React, { createContext, useContext, useState } from 'react';

const CharacterContext = createContext();

export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter must be used within CharacterProvider');
  }
  return context;
};

export const CharacterProvider = ({ children }) => {
  const [character, setCharacter] = useState({
    name: '勇者',
    level: 1,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    exp: 0,
    expToNextLevel: 100,
  });

  const gainExp = (amount) => {
    setCharacter(prev => {
      let newExp = prev.exp + amount;
      let newLevel = prev.level;
      let newExpToNextLevel = prev.expToNextLevel;

      // Level up logic
      while (newExp >= newExpToNextLevel) {
        newExp -= newExpToNextLevel;
        newLevel++;
        newExpToNextLevel = Math.floor(newExpToNextLevel * 1.5);
      }

      return {
        ...prev,
        exp: newExp,
        level: newLevel,
        expToNextLevel: newExpToNextLevel,
      };
    });
  };

  const takeDamage = (amount) => {
    setCharacter(prev => ({
      ...prev,
      hp: Math.max(0, prev.hp - amount),
    }));
  };

  const heal = (amount) => {
    setCharacter(prev => ({
      ...prev,
      hp: Math.min(prev.maxHp, prev.hp + amount),
    }));
  };

  return (
    <CharacterContext.Provider
      value={{
        character,
        gainExp,
        takeDamage,
        heal,
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
};
```

### Advanced State Management (Zustand)

For complex state with less boilerplate:

```javascript
// src/stores/battleStore.js
import { create } from 'zustand';

const useBattleStore = create((set, get) => ({
  // State
  player: null,
  enemy: null,
  battleLog: [],
  isPlayerTurn: true,
  battleStatus: 'idle', // idle, ongoing, victory, defeat

  // Actions
  startBattle: (player, enemy) => set({
    player,
    enemy,
    battleLog: ['戰鬥開始！'],
    isPlayerTurn: true,
    battleStatus: 'ongoing',
  }),

  performAttack: (attacker, target, damage) => {
    const { battleLog } = get();
    const newLog = [
      ...battleLog,
      `${attacker.name} 對 ${target.name} 造成 ${damage} 點傷害！`,
    ];

    set({
      [target.type]: {
        ...target,
        hp: Math.max(0, target.hp - damage),
      },
      battleLog: newLog,
      isPlayerTurn: !get().isPlayerTurn,
    });

    // Check for battle end
    if (target.hp <= 0) {
      set({ battleStatus: target.type === 'enemy' ? 'victory' : 'defeat' });
    }
  },

  useSkill: (skill) => {
    const { player, enemy } = get();

    if (player.mp < skill.mpCost) {
      return false; // Not enough MP
    }

    // Deduct MP
    set({
      player: {
        ...player,
        mp: player.mp - skill.mpCost,
      },
    });

    // Calculate damage
    const damage = Math.floor(player.attack * skill.multiplier);

    // Perform attack
    get().performAttack(player, enemy, damage);

    return true;
  },

  endBattle: () => set({
    player: null,
    enemy: null,
    battleLog: [],
    battleStatus: 'idle',
  }),
}));

export default useBattleStore;
```

---

## Data Flow

### Props Down, Events Up

```jsx
// Parent component
function InventoryScreen() {
  const [items, setItems] = useState([...]);

  const handleItemUse = (itemId) => {
    // Handle item use
    setItems(items.filter(item => item.id !== itemId));
  };

  return (
    <InventoryGrid
      items={items}           // Props down
      onItemUse={handleItemUse}  // Events up
    />
  );
}

// Child component
function InventoryGrid({ items, onItemUse }) {
  return (
    <div className="inventory-grid">
      {items.map(item => (
        <ItemCard
          key={item.id}
          item={item}
          onUse={() => onItemUse(item.id)}
        />
      ))}
    </div>
  );
}
```

### State Lifting

When multiple components need to share state, lift it to their common parent:

```jsx
function BattleScreen() {
  // Lifted state
  const [playerHP, setPlayerHP] = useState(100);
  const [enemyHP, setEnemyHP] = useState(100);

  // Shared by multiple children
  return (
    <>
      <PlayerPanel hp={playerHP} />
      <EnemyPanel hp={enemyHP} />
      <BattleLog playerHP={playerHP} enemyHP={enemyHP} />
    </>
  );
}
```

---

## API Integration

### API Service Setup

```javascript
// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export default new ApiService();
```

### Battle Service Example

```javascript
// src/services/battleService.js
import api from './api';

export const battleService = {
  // Start a new battle
  async startBattle(enemyId) {
    return await api.post('/battles', { enemyId });
  },

  // Perform an attack
  async performAttack(battleId, skillId) {
    return await api.post(`/battles/${battleId}/attack`, { skillId });
  },

  // End battle
  async endBattle(battleId, result) {
    return await api.post(`/battles/${battleId}/end`, { result });
  },
};
```

### Error Handling

```javascript
// src/hooks/useBattle.js
import { useState } from 'react';
import { battleService } from '../services/battleService';

export const useBattle = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const performAttack = async (battleId, skillId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await battleService.performAttack(battleId, skillId);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    performAttack,
    loading,
    error,
  };
};
```

### Loading States

```jsx
function BattleScreen() {
  const { performAttack, loading, error } = useBattle();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    // ... battle UI
  );
}
```

---

## Routing

### React Router Setup

```javascript
// src/router.jsx
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from './layouts/MainLayout/MainLayout';
import HomeScreen from './screens/HomeScreen/HomeScreen';
import BattleScreen from './screens/BattleScreen/BattleScreen';
import InventoryScreen from './screens/InventoryScreen/InventoryScreen';
import ShopScreen from './screens/ShopScreen/ShopScreen';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomeScreen />,
      },
      {
        path: 'battle',
        element: <BattleScreen />,
      },
      {
        path: 'inventory',
        element: <InventoryScreen />,
      },
      {
        path: 'shop',
        element: <ShopScreen />,
      },
    ],
  },
]);
```

```jsx
// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './styles/variables.css';
import './styles/reset.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
```

### Navigation

```jsx
import { Link, useNavigate } from 'react-router-dom';

function Navigation() {
  const navigate = useNavigate();

  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/battle">Battle</Link>
      <Link to="/inventory">Inventory</Link>
      <button onClick={() => navigate('/shop')}>Go to Shop</button>
    </nav>
  );
}
```

---

## Testing Strategy

【參考：05-interactions/】

### Unit Tests (Components)

```javascript
// src/components/atoms/Button/Button.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });

  it('applies primary variant class', () => {
    render(<Button variant="primary">Click me</Button>);
    const button = screen.getByText('Click me');
    expect(button).toHaveClass('button--primary');
  });
});
```

### Integration Tests (Flows)

```javascript
// src/hooks/useBattle.test.js
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useBattle } from './useBattle';

describe('useBattle', () => {
  it('starts a battle correctly', () => {
    const { result } = renderHook(() => useBattle());

    act(() => {
      result.current.startBattle(mockPlayer, mockEnemy);
    });

    expect(result.current.battleStatus).toBe('ongoing');
    expect(result.current.isPlayerTurn).toBe(true);
  });

  it('switches turns after attack', () => {
    const { result } = renderHook(() => useBattle());

    act(() => {
      result.current.startBattle(mockPlayer, mockEnemy);
      result.current.performAttack();
    });

    expect(result.current.isPlayerTurn).toBe(false);
  });
});
```

### E2E Tests (User Journeys)

```javascript
// tests/battle.spec.js
import { test, expect } from '@playwright/test';

test('complete battle flow', async ({ page }) => {
  // Navigate to game
  await page.goto('http://localhost:3000');

  // Start battle
  await page.click('text=開始戰鬥');
  await expect(page.locator('.battle-screen')).toBeVisible();

  // Use basic attack skill
  await page.click('.skill-button--attack');

  // Check battle log updated
  await expect(page.locator('.battle-log')).toContainText('攻擊成功');

  // Check enemy HP decreased
  const enemyHP = await page.locator('.enemy .hp-bar__fill').getAttribute('style');
  expect(enemyHP).toContain('width:');

  // Continue until victory
  while (await page.locator('.battle-status').textContent() === '戰鬥中') {
    await page.click('.skill-button--attack');
    await page.waitForTimeout(500);
  }

  // Check victory screen
  await expect(page.locator('text=勝利')).toBeVisible();
});
```

### Accessibility Tests

```javascript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('Button has no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Deployment

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Build Optimization

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Output directory
    outDir: 'dist',

    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
        },
      },
    },

    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
      },
    },
  },
});
```

### Environment Variables

```bash
# .env.production
VITE_API_URL=https://api.cultivationclicker.com
VITE_ENABLE_ANALYTICS=true
```

### Asset Optimization

- **Images**: Use WebP format, compress with tools like Squoosh
- **Fonts**: Subset fonts to include only needed characters
- **Code**: Enable minification and tree shaking

### CDN Setup

Host static assets on CDN for faster delivery:

```javascript
// vite.config.js
export default defineConfig({
  base: 'https://cdn.cultivationclicker.com/',
});
```

### Hosting Options

**Vercel** (Recommended for React/Vite)
```bash
npm install -g vercel
vercel deploy
```

**Netlify**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**GitHub Pages**
```bash
npm run build
npx gh-pages -d dist
```

---

## Step-by-Step Implementation Roadmap

### Phase 1: Project Setup (Week 1)

1. **Initialize project**
   ```bash
   npm create vite@latest cultivation-clicker -- --template react
   cd cultivation-clicker
   npm install
   ```

2. **Set up project structure**
   - Create folder structure
   - Set up CSS reset and variables
   - Configure build tools

3. **Install dependencies**
   ```bash
   npm install react-router-dom zustand
   npm install -D vitest @testing-library/react @playwright/test
   ```

### Phase 2: Design System (Week 2)

4. **Implement design tokens**
   - Create CSS variables file
   - Set up typography
   - Define color palette

5. **Build core components (Atoms)**
   - Button
   - Input
   - Icon
   - Badge

6. **Test core components**
   - Write unit tests
   - Set up Storybook (optional)

### Phase 3: Compound Components (Week 3-4)

7. **Build molecules**
   - StatusBar
   - ProgressBar
   - SkillButton
   - ItemCard

8. **Build organisms**
   - CharacterPanel
   - BattleLog
   - SkillGrid
   - InventoryGrid

9. **Test compound components**
   - Integration tests
   - Visual regression tests

### Phase 4: Screens and Flows (Week 5-6)

10. **Implement screens**
    - HomeScreen
    - BattleScreen
    - InventoryScreen
    - ShopScreen

11. **Implement state management**
    - Character state
    - Battle state
    - Inventory state

12. **Implement flows**
    - Battle flow
    - Inventory management flow
    - Shop purchase flow

### Phase 5: Interactions (Week 7)

13. **Add animations**
    - Battle animations
    - Transitions
    - Micro-interactions

14. **Implement feedback**
    - Loading states
    - Error messages
    - Success notifications

### Phase 6: Optimization (Week 8)

15. **Performance optimization**
    - Code splitting
    - Lazy loading
    - Image optimization

16. **Accessibility**
    - Keyboard navigation
    - Screen reader support
    - Focus management

### Phase 7: Testing and Deployment (Week 9-10)

17. **Comprehensive testing**
    - Unit tests (100% coverage)
    - Integration tests
    - E2E tests

18. **Deploy to production**
    - Build optimization
    - Deploy to hosting
    - Set up monitoring

---

## Summary

This implementation guide provides a complete roadmap for building Cultivation Clicker:

1. **Technology Stack**: Modern tools (React, Vite, Zustand)
2. **Project Structure**: Organized and scalable architecture
3. **Component Implementation**: Atomic design methodology
4. **State Management**: Centralized and predictable
5. **Testing**: Comprehensive coverage at all levels
6. **Deployment**: Optimized production build

**Next Steps**:
1. Set up project structure
2. Implement design tokens
3. Build components from atoms to organisms
4. Compose screens using components
5. Implement state management and flows
6. Add animations and interactions
7. Optimize and deploy

【相關文檔】
- `01-design-system/` - Design system specifications
- `04-components/` - Component specifications
- `03-flows/` - User flow documentation
- `05-interactions/` - Interaction design
- `06-specifications/performance-optimization.md` - Performance guidelines
- `06-specifications/responsive-design.md` - Responsive design specs
