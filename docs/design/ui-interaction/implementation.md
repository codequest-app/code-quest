# UI Interaction - Implementation

Technical implementation guide for RPG-CLI UI components and interactions.

---

## Core Components

### 1. ProgressBar Component

**File**: `ui/src/components/UI/ProgressBar.tsx`

```tsx
interface ProgressBarProps {
  value: number;
  max: number;
  size?: 'compact' | 'normal';  // 4 blocks or 10 blocks
  color: 'hp' | 'mp' | 'exp' | 'enemy';
  showNumbers?: boolean;
}

function ProgressBar({
  value,
  max,
  size = 'normal',
  color,
  showNumbers = true
}: ProgressBarProps) {
  const blocks = size === 'compact' ? 4 : 10;
  const filled = Math.floor((value / max) * blocks);
  const empty = blocks - filled;

  const colors = {
    hp: '#E74C3C',
    mp: '#3498DB',
    exp: '#F39C12',
    enemy: '#E67E22'
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-pixel">
        {'█'.repeat(filled)}{'░'.repeat(empty)}
      </span>
      {showNumbers && (
        <span className="text-xs font-mono" style={{ color: colors[color] }}>
          {value}/{max}
        </span>
      )}
    </div>
  );
}
```

---

### 2. TypewriterEffect Class

**File**: `ui/src/utils/TypewriterEffect.ts`

```typescript
class TypewriterEffect {
  private element: HTMLElement;
  private text: string;
  private speed: number;
  private index: number = 0;
  private lastTime: number = 0;
  private onComplete?: () => void;

  constructor(
    element: HTMLElement,
    text: string,
    speed: number = 50,
    onComplete?: () => void
  ) {
    this.element = element;
    this.text = text;
    this.speed = speed;
    this.onComplete = onComplete;
  }

  private animate(timestamp: number) {
    if (timestamp - this.lastTime >= this.speed) {
      if (this.index < this.text.length) {
        this.element.textContent += this.text[this.index];
        this.index++;
        this.lastTime = timestamp;

        // Play typing sound every 3 characters
        if (this.index % 3 === 0) {
          this.playTypeSound();
        }
      } else {
        this.onComplete?.();
        return; // Complete
      }
    }
    requestAnimationFrame((t) => this.animate(t));
  }

  start() {
    this.element.textContent = '';
    requestAnimationFrame((t) => this.animate(t));
  }

  stop() {
    this.index = this.text.length;
  }

  private playTypeSound() {
    const audio = new Audio('/sounds/type.wav');
    audio.volume = 0.3;
    audio.play().catch(() => {}); // Ignore errors
  }
}

export default TypewriterEffect;
```

---

### 3. Virtual Scrolling Implementation

**File**: `ui/src/components/Chat/VirtualMessageList.tsx`

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

function VirtualMessageList({ messages }: { messages: Message[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated message height
    overscan: 5 // Render 5 extra items above/below
  });

  return (
    <div
      ref={parentRef}
      className="message-list-container"
      style={{ height: '500px', overflow: 'auto' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const message = messages[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`
              }}
            >
              <MessageBubble message={message} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

### 4. Streaming Response Handler

**File**: `ui/src/hooks/useStreamingResponse.ts`

```typescript
function useStreamingResponse(onChunk: (chunk: string) => void) {
  const ws = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    ws.current = new WebSocket('ws://localhost:3001');

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'chunk') {
        onChunk(data.content);
      } else if (data.type === 'complete') {
        // Response finished
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      // Auto-reconnect after 3 seconds
      setTimeout(connect, 3000);
    };
  }, [onChunk]);

  useEffect(() => {
    connect();
    return () => {
      ws.current?.close();
    };
  }, [connect]);

  const send = useCallback((message: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'message',
        content: message
      }));
    }
  }, []);

  return { send };
}
```

---

### 5. Skill Casting Handler

**File**: `ui/src/components/Skills/SkillButton.tsx`

```tsx
interface Skill {
  id: string;
  name: string;
  icon: string;
  mpCost: number;
  parameters?: SkillParameter[];
}

function SkillButton({ skill, playerMP, onCast }: {
  skill: Skill;
  playerMP: number;
  onCast: (skillId: string, params: Record<string, any>) => void;
}) {
  const [showDialog, setShowDialog] = useState(false);
  const insufficient = playerMP < skill.mpCost;

  const handleClick = () => {
    if (insufficient) {
      showToast('Insufficient MP!', 'error');
      playSound('error.wav');
      return;
    }

    if (skill.parameters && skill.parameters.length > 0) {
      setShowDialog(true);
    } else {
      executeCast();
    }
  };

  const executeCast = (params?: Record<string, any>) => {
    // Play casting animation
    playCastingAnimation(skill);

    // Deduct MP
    updateMP(playerMP - skill.mpCost);

    // Execute skill
    onCast(skill.id, params || {});

    setShowDialog(false);
  };

  return (
    <>
      <button
        className={`skill-btn ${insufficient ? 'insufficient' : ''}`}
        onClick={handleClick}
        disabled={insufficient}
      >
        <div className="skill-icon">{skill.icon}</div>
        <div className="skill-name">{skill.name}</div>
        <div className="skill-cost">MP{skill.mpCost}</div>
      </button>

      {showDialog && (
        <SkillParameterDialog
          skill={skill}
          onSubmit={executeCast}
          onCancel={() => setShowDialog(false)}
        />
      )}
    </>
  );
}
```

---

## Optimization Techniques

### 1. Lazy Loading Images

```typescript
// Intersection Observer for lazy loading
const useLazyLoad = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || '';
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px'
      }
    );

    document.querySelectorAll('img[data-src]').forEach((img) => {
      observer.observe(img);
    });

    return () => observer.disconnect();
  }, []);
};
```

---

### 2. Debounced Input

```typescript
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage in search
function SearchInput() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    if (debouncedSearch) {
      performSearch(debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

---

### 3. Request Animation Frame for Smooth Animations

```typescript
class AnimationController {
  private rafId: number | null = null;

  animate(callback: (timestamp: number) => boolean) {
    const loop = (timestamp: number) => {
      const shouldContinue = callback(timestamp);

      if (shouldContinue) {
        this.rafId = requestAnimationFrame(loop);
      } else {
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

// Usage for MP bar animation
const animateMP Decrease = (from: number, to: number) => {
  const controller = new AnimationController();
  const duration = 300; // ms
  const startTime = performance.now();

  controller.animate((timestamp) => {
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const currentMP = from - (from - to) * progress;
    updateMPDisplay(currentMP);

    return progress < 1;
  });
};
```

---

## Error Handling

### 1. Network Error Recovery

```typescript
class NetworkErrorHandler {
  private maxRetries = 3;
  private retryCount = 0;
  private retryDelay = 1000; // Start with 1s

  async fetchWithRetry<T>(
    fetchFn: () => Promise<T>
  ): Promise<T> {
    try {
      return await fetchFn();
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;

        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);

        showToast(`Retrying... (${this.retryCount}/${this.maxRetries})`, 'info');

        await this.sleep(delay);
        return this.fetchWithRetry(fetchFn);
      }

      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reset() {
    this.retryCount = 0;
  }
}
```

---

### 2. User-Friendly Error Messages

```typescript
const errorMessages: Record<string, string> = {
  ENOENT: 'Cannot find claude-cli. Please install it first.',
  ECONNREFUSED: 'Cannot connect to server. Is it running?',
  ETIMEDOUT: 'Request timed out. Check your network connection.',
  UNAUTHORIZED: 'Invalid API key. Please check your settings.',
};

function handleError(error: any) {
  const code = error.code || 'UNKNOWN';
  const message = errorMessages[code] || error.message;

  showErrorModal({
    title: 'Something went wrong',
    message,
    actions: [
      {
        label: 'Retry',
        onClick: () => retryLastAction()
      },
      {
        label: 'Get Help',
        onClick: () => openHelpPage()
      }
    ]
  });
}
```

---

### 3. Graceful Degradation

```typescript
// Feature detection
const features = {
  webSocket: 'WebSocket' in window,
  localStorage: (() => {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch {
      return false;
    }
  })(),
  audioContext: 'AudioContext' in window || 'webkitAudioContext' in window
};

// Fallback implementations
function saveConversation(data: any) {
  if (features.localStorage) {
    localStorage.setItem('conversation', JSON.stringify(data));
  } else {
    // Fallback to in-memory only
    console.warn('LocalStorage not available, data will not persist');
  }
}

function playSound(src: string) {
  if (features.audioContext) {
    const audio = new Audio(src);
    audio.play().catch(console.warn);
  } else {
    // Silently skip sound
  }
}
```

---

## Performance Monitoring

```typescript
// Performance tracking
class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  mark(name: string) {
    this.marks.set(name, performance.now());
  }

  measure(startMark: string, endMark: string): number {
    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);

    if (start === undefined || end === undefined) {
      return 0;
    }

    return end - start;
  }

  logMetrics() {
    console.group('Performance Metrics');
    console.log('Initial Load:', this.measure('loadStart', 'loadEnd'), 'ms');
    console.log('First Paint:', this.measure('loadEnd', 'firstPaint'), 'ms');
    console.log('Interactive:', this.measure('loadEnd', 'interactive'), 'ms');
    console.groupEnd();
  }
}

// Usage
const perf = new PerformanceMonitor();
perf.mark('loadStart');
// ... loading logic ...
perf.mark('loadEnd');
perf.mark('firstPaint');
// ... render logic ...
perf.mark('interactive');
perf.logMetrics();
```

---

## Accessibility Implementation

### 1. Keyboard Navigation

```typescript
function useKeyboardNavigation(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Tab':
          // Let browser handle
          break;

        case 'Escape':
          closeAllModals();
          break;

        case 'Enter':
          if (e.ctrlKey) {
            submitForm();
          }
          break;

        case 'k':
          if (e.ctrlKey) {
            e.preventDefault();
            clearInput();
          }
          break;
      }
    };

    element.addEventListener('keydown', handler);
    return () => element.removeEventListener('keydown', handler);
  }, [ref]);
}
```

---

### 2. Screen Reader Announcements

```typescript
function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Usage
function onLevelUp(newLevel: number) {
  announceToScreenReader(`Level up! You are now level ${newLevel}`, 'assertive');
}
```

---

## Summary

### Key Implementation Principles

**✅ Component-Based**:
- Reusable UI components
- Clear prop interfaces
- Isolated state management

**✅ Performance-Focused**:
- Virtual scrolling for long lists
- Lazy loading for media
- Request animation frame for smoothness
- Debouncing for expensive operations

**✅ Error-Resilient**:
- Retry logic with exponential backoff
- Graceful degradation
- User-friendly error messages

**✅ Accessible**:
- Keyboard navigation support
- Screen reader announcements
- Focus management

**✅ Maintainable**:
- TypeScript for type safety
- Clear separation of concerns
- Comprehensive error handling

---

**Version**: v1.0
**Last Updated**: 2026-02-05
