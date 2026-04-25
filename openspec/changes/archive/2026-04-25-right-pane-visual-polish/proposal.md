## Why

The right pane's empty / "no content" surfaces look unfinished:

1. **Spec empty state** ("No openspec/ directory") renders as left-aligned
   small text glued to the top, surrounded by a huge black void below.
   Looks like a broken render, not an intentional design.
2. **Files pane with sparse content** (e.g., 2 folders) leaves the bottom
   90% of the pane as undifferentiated black space. No "this is the end"
   signal — feels like content failed to load.
3. **No per-pane status footer** — users have no quick "how many changes /
   how many specs / how many files" signal without scanning the list.

## What Changes

- **Upgrade `EmptyState` component**: add `icon` prop (renders 32-40px above
  the message); ensure flex-1 + items-center + justify-center; add
  `max-width` constraint on the message so a long string doesn't span the
  full pane. Optional `hint` slot below message for code snippet / CTA.
- **SpecPane no-openspec state**: pass ClipboardDocumentListIcon as icon;
  render `openspec init` as a mono code pill in the hint slot. Same
  treatment for `openspec-cli-not-found` (with command suggestion).
- **GitPane not-a-repo state**: pass branch glyph icon for visual anchor.
- **Add `<PaneStatusFooter>` component**: thin sticky footer at bottom of
  pane, mono text-xs, summarizes pane content (e.g., "3 changes · main"
  for git, "5 specs · 2 active" for spec, "12 files · 3 modified" for
  files). Solves the "view has no end" feeling.
- **Pending button pattern**: when a user-triggered async (Stage all,
  Commit, Fetch, Pull, Push, Discard) is in flight, show inline spinner
  inside the button + disable. Helper hook `useAsyncAction(fn)` returns
  `{ run, pending }` to standardize.

Out of scope:
- Top progress bar for long-running streams (separate change if needed).
- Tab text alignment polish (cosmetic, low priority).
- Files pane "decorative empty area" (dot grid / illustration) — dev tool
  should stay calm; not over-decorate.

## Capabilities

- **client-empty-state**: EmptyState supports icon + hint slot;
  per-pane empty UIs use it consistently. Status footer summarizes pane
  content. User-triggered async actions show inline pending state.
