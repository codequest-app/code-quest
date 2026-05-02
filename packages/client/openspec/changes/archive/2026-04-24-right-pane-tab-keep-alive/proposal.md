## Why

`RightPane.tsx` renders tabs with conditional mount:

```tsx
{active === 'files' && <FilesPane cwd={cwd} onMention={onMention} />}
{active === 'git'   && <GitPane cwd={cwd} />}
{active === 'spec'  && <SpecPane cwd={cwd} />}
```

Switching tabs **unmounts** the previous pane. React destroys every component-local piece of state in the subtree:

- `FilesPane`'s `previewPath` selection
- `FileTree`'s `loadingItemData` / `loadingItemChildrens`
- `useTree` (`@headless-tree/react`) — **expanded-folder set and already-fetched children cache**
- Scroll position in every pane

Switching back remounts a blank instance → the tree re-fetches every visible folder, the user loses their expansion, and scroll jumps to top. This is the most visible "feels broken" behavior when the SpecPane / GitPane is used mid-browse.

Note: Data layers that live in providers (`FsContext`, `GitContext`, `OpenspecContext`) already cache their RPC results — fetches against the cache return instantly. The problem is strictly **component-local UI state** (tree expansion, selection, scroll) that Contexts can't capture.

## What Changes

- **Keep-alive pattern in `RightPane`**: track which tabs have been opened at least once via a `useRef<Set<TabId>>`. A tab is mounted as soon as it becomes active; after that it stays mounted. Inactive tabs are hidden via `hidden` attribute (HTML native) so they stay in the DOM but take no space or interaction.

  ```tsx
  <div hidden={active !== 'files'}>{mounted.has('files') && <FilesPane ... />}</div>
  <div hidden={active !== 'git'}>{mounted.has('git') && <GitPane ... />}</div>
  <div hidden={active !== 'spec'}>{mounted.has('spec') && <SpecPane ... />}</div>
  ```

- **Lazy first-mount**: Panes only mount when first activated (not all three on initial render) — keeps the cold-start cost the same as today.
- **Dev-flag escape hatch**: an optional `preserveState={false}` prop (defaulting `true`) preserves today's behavior for any caller that prefers to reset on tab change — none of the current callers need this, but it's cheap to keep the hook.

Explicitly out of scope:
- Persisting tree expansion across full-page reloads (localStorage) — separate feature, separate change.
- Pre-mounting inactive tabs for faster first-switch — net-negative since most users never touch SpecPane.
- Fixing the analogous problem in the sidebar's project switcher (if any).

## Capabilities

- **right-pane**: tabs preserve their local state (tree expansion, selection, scroll) across switches.
