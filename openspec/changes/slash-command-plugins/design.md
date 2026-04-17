## Context

Slash commands currently have two separate invocation paths:

1. **Slash menu** (`executeSlashCommand` in `ChannelComposeContext`) → `sendMessage(cmd)` → `ChannelMessagesContext.sendMessage` wrapper
2. **⌘K Command menu** → `callbacks.onXxx?.()` in `ComposeToolbar` → `setActiveDialog(...)` or inline handler

`/reload-plugins` was already intercepted ad-hoc in the `sendMessage` wrapper. `/usage` and `/rewind` are driven by `ComposeToolbar.activeDialog` local state, wired through `callbacks`. `/compact` goes straight to CLI.

The goal is to unify all four behind a feature registry so both entry points call the same feature action.

## Goals / Non-Goals

**Goals:**
- `ChannelFeature` / `SlashCommandFeature` / `MenuItemFeature` contract covering all invocation patterns
- Features declare their own capabilities — system auto-wires slash menu and ⌘K menu entries
- Each feature manages its own open/closed state (no centralized `activeDialog`)
- `sendMessage` wrapper queries the registry instead of hardcoding command names
- Features co-located with their components under `src/features/<feature-name>/`

**Non-Goals:**
- Migrating all slash commands (only the 4 listed)
- Server-side feature discovery or dynamic registration
- Feature ordering / priority

---

## ChannelFeature Interface Contract

```ts
/** Base interface. All features implement this. */
interface ChannelFeature {
  id: string;
}

/**
 * Feature with a slash command entry.
 * Automatically appears in the Slash Commands section of ⌘K and the slash menu.
 */
interface SlashCommandFeature extends ChannelFeature {
  /** e.g. '/usage' — registry key, default match */
  command: string;

  /** Custom match for commands with arguments (e.g. '/compact 50'). Default: exact string match. */
  match?(message: string): boolean;

  /**
   * Called from sendMessage intercept when match() returns true.
   * Must NOT forward to CLI unless the feature explicitly does so (e.g. /compact).
   */
  invoke(message: string): void;

  /**
   * Unified execute action — called from slash menu click, ⌘K click, or invoke delegation.
   * If defined, slash menu click calls execute() directly (skips sendMessage).
   * If omitted, slash menu click falls through to sendMessage → invoke().
   */
  execute?(): void;
}

/**
 * Feature with a ⌘K menu item entry.
 * Automatically appears in the specified section of the ⌘K menu.
 */
interface MenuItemFeature extends ChannelFeature {
  menuItem: {
    label: string;
    section: string;
    trailing?: ReactNode;
    disabled?: boolean;
  };

  /** Called when the ⌘K menu item is clicked. */
  execute(): void;
}
```

A feature may implement any combination:
- **`SlashCommandFeature` only** — slash menu + Slash Commands section in ⌘K (`/reload-plugins`, `/compact`)
- **`MenuItemFeature` only** — ⌘K menu item only (`/rewind`)
- **Both** — slash menu + dedicated ⌘K section entry + Slash Commands section (`/usage`)

### Per-feature contract

| Feature | Implements | `invoke` | `execute` | ⌘K section | Slash menu |
|---|---|---|---|---|---|
| `/reload-plugins` | `SlashCommandFeature` | calls `reloadPlugins()` RPC | delegates to invoke | Slash Commands (auto) | ✅ |
| `/usage` | Both | delegates to `execute` | opens dialog + refresh | Slash Commands (auto) + Model | ✅ |
| `/rewind` | `MenuItemFeature` | — | opens dialog | Context | ❌ |
| `/compact` | `SlashCommandFeature` | calls `chat:send` to CLI | — | Slash Commands (auto) | ✅ |

### ⌘K menu auto-wiring

```
registry.getAll():
  SlashCommandFeature instances → each gets an entry in 'Slash Commands' section
  MenuItemFeature instances     → each gets an entry in feature.menuItem.section
  Both                          → two entries (one in each section)
```

`command-menu-items.tsx` reads the registry instead of manually declaring each feature. Existing static items (MCP status, Manage plugins, etc.) remain as-is.

### Registry dispatch logic

```
sendMessage(message):
  feature = registry.findSlashCommand(msg)
  if feature:
    feature.invoke(message)
    return   ← early exit, never reaches chat:send

executeSlashCommand(cmd):           // slash menu click
  clearSlashToken()
  feature = registry.getSlashCommand(cmd)
  if feature?.execute:
    feature.execute()               ← direct, skip sendMessage
  else:
    sendMessage(cmd)                ← falls through to invoke()
```

### Feature open state

`/usage` and `/rewind` each hold their own open state as a plain module-level signal:

```ts
// src/features/usage/usage-feature.ts
let _open = false;
const _subs = new Set<() => void>();
const notify = () => _subs.forEach(fn => fn());

export const usageFeature: SlashCommandFeature & MenuItemFeature = {
  id: 'usage',
  command: '/usage',
  menuItem: { label: 'Account & usage…', section: 'Model' },
  invoke(_msg) { this.execute(); },
  execute() {
    _open = true;
    notify();
    requestUsageUpdate();
  },
  subscribe: (fn: () => void) => (_subs.add(fn), () => _subs.delete(fn)),
  get isOpen() { return _open; },
  close() { _open = false; notify(); },
};
```

Dialog components subscribe via a thin `useSyncExternalStore` hook colocated in the feature folder.

---

## Folder Structure

```
src/
  lib/
    feature.ts               ← ChannelFeature, SlashCommandFeature, MenuItemFeature interfaces
    feature-registry.ts      ← registry implementation
  features/
    usage/
      AccountUsageDialog.tsx ← moved from src/components/
      usage-feature.ts
      use-usage-open.ts      ← useSyncExternalStore hook
    rewind/
      RewindDialog.tsx       ← moved from src/components/
      rewind-feature.ts
      use-rewind-open.ts
    reload-plugins/
      reload-plugins-feature.ts
    compact/
      compact-feature.ts
  components/                ← shared/generic components only
```

---

## Decisions

### Features declare capabilities via interfaces, not section strings
**Decision:** `SlashCommandFeature` → auto Slash Commands section; `MenuItemFeature.menuItem.section` → explicit ⌘K section.

**Rationale:** Removes per-feature manual wiring in `command-menu-items.tsx`. Adding a new feature only requires registering it — no changes to command menu code.

**Alternative considered:** Keep manual callbacks — rejected (doesn't scale, inconsistent).

### Feature state as module-level signal, not Zustand store
**Decision:** Plain subscriber pattern per feature.

**Rationale:** Each feature has exactly one boolean. Zustand adds dependency and boilerplate for a 3-line problem.

### Co-locate feature + component in named subfolder under `src/features/`
**Decision:** `src/features/<feature-name>/` contains feature definition, dialog component, and hook.

**Rationale:** Each feature is a self-contained unit. Co-location makes it easy to find all related code and delete a feature cleanly.

### ⌘K callbacks removed — registry drives menu
**Decision:** `callbacks.onReloadPlugins`, `callbacks.onOpenAccountUsage`, `callbacks.onRewind` removed; `command-menu-items.tsx` calls `feature.execute()` directly from registry.

**Rationale:** Callbacks were indirection with no benefit once features are self-contained.

---

## Risks / Trade-offs

- **Moving `AccountUsageDialog` and `RewindDialog`** → import paths change across codebase; low risk but requires search-and-replace.
- **Module-level state survives unmount** → feature `close()` must be called on dialog unmount to prevent stale open state on remount.
- **`requestUsageUpdate` dependency** → usage feature needs `socket` + `channelId`; inject via `createUsageFeature({ socket, channelId })` called inside `ChannelMessagesProvider`.

## Migration Plan

1. Define interfaces in `src/lib/feature.ts`, registry in `src/lib/feature-registry.ts`
2. Create feature subfolders; move `AccountUsageDialog`, `RewindDialog` into them
3. Implement 4 features with open state signals
4. Wire registry into `ChannelMessagesContext` (replace hardcoded check)
5. Update `executeSlashCommand` to check `feature.execute`
6. Update `command-menu-items.tsx` to read from registry (remove manual callbacks)
7. Remove `activeDialog` for `usage` and `rewind` from `ComposeToolbar`
8. Update tests
