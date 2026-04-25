## Tasks

### 1. Upgrade EmptyState component
- [x] Add `icon?: ReactNode` prop; render at 32-40px above message in muted color.
- [x] Add `hint?: ReactNode` slot below message (for code snippets, CTA).
- [x] Constrain message `max-w-xs` so long strings don't span full pane.
- [x] Existing 5+ call sites still work (icon/hint optional).

### 2. SpecPane empty states
- [x] `no-openspec`: ClipboardDocumentListIcon + message + `<code>openspec init</code>` mono pill in hint.
- [x] `openspec-cli-not-found`: same pattern with `npm install -g @openspec/cli` (or whatever the install command is) hint.
- [x] Other errors: just message (no icon/hint).

### 3. GitPane empty states
- [x] `notARepo`: branch glyph (⎇) icon, message, optional `git init` hint.
- [x] `error`: just message.

### 4. PaneStatusFooter component
- [x] New `components/ui/PaneStatusFooter.tsx`: sticky bottom bar, mono text-xs, gap-2 between items, border-top subtle.
- [x] FilesPane: render footer summarizing total visible files / dirs (count tracked separately via FileTree expansion if needed; v1 just shows current cwd's basename).
- [x] GitPane: footer shows `<branch> · N changes · ↑M ↓N` when status loaded.
- [x] SpecPane: footer shows `N changes · M specs` when list loaded.

### 5. useAsyncAction hook + pending button pattern
- [x] New `hooks/useAsyncAction.ts`: takes async fn, returns `{ run, pending }`.
- [x] GitPane buttons (Stage all / Commit / Fetch / Pull / Push / Discard): switch to useAsyncAction, render inline Spinner during pending, disable button.
- [x] SpecPane Archive button: same pattern.

### 6. Verification
- [x] `pnpm -F client test` green (incl. existing pane tests).
- [x] `npx openspec validate right-pane-visual-polish --strict`.
