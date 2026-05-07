## Why

`topbar-live-sessions` v1 shipped basic pills — click switches to that session. F.html's design has more: a `⋯` per pill that opens a popover showing **status + last assistant message preview + Split chat / Stop actions**. This is the "always-on global session inspector" the three-column mockup promises.

We have everything needed:
- `useSession().sessions` with state, title, lastMessage (need to verify last-message availability — may need to add).
- Existing popover primitive used by BranchPopover + WorktreeContextMenu.
- Settings dialog pattern for the layout.

## What Changes

- Add a `⋯` button to each pill in `<TopbarLiveSessions>` (only visible on hover/focus; preserves the pill's click=activate primary action).
- Add **`<LiveSessionPopover>`**:
  - Header: full project/worktree path + provider/model badge (from session metadata).
  - Body: status + last assistant message snippet (~200 chars, fallback "no messages yet"), tokens used (if available), elapsed time since last activity.
  - Actions row:
    - **Open** — same as click (activate session).
    - **Split chat here** — disabled if `split-chat` not yet shipped; placeholder toast.
    - **Stop** — only when `state === 'busy'`; calls existing cancel RPC.
- Wire popover trigger in `WorktreeChildList`-style overlay state inside `<TopbarLiveSessions>`.

Out of scope:
- "Recent sessions" overflow popover (the `+N` chip clicks today as a no-op; future polish).
- New session metadata not currently broadcast (e.g. message count, branch).

## Impact

**New:**
- `packages/client/src/components/LiveSessionPopover.tsx` + test.

**Modified:**
- `packages/client/src/components/TopbarLiveSessions.tsx` — add `⋯` per pill + popover state.
- Possibly `useSession` / session schema — only if last-message field is missing today.

**Risk:** low. Pure UI on data we already have; no server changes (unless lastMessage isn't broadcast, in which case a tiny addition).
