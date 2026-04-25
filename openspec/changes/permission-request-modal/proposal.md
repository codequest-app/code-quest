## Re-scope after audit

Original premise: "cc-office has no permission request UI; F.html shows a 🛡 modal that we need."

**Audit finding:** cc-office **already has full permission request UI** via `<ToolPermissionCard>` rendered inline in `<ChatMessage>` when `control:permission` fires. It supports Allow / Deny / Allow always (via `permissionSuggestions`) + question answering. F.html's "centered modal" is a DESIGN CHOICE, not a missing feature — and the inline card is arguably better UX (preserves chat context, doesn't trap focus, no context switch).

## Real gap (much smaller)

The inline card only helps if the user is **currently looking at that chat tab**. If a permission request comes in for a session in another tab (or while the right pane covers chat), the user sees nothing.

This change should be re-scoped to **per-tab pending-permission indicator**:

- A small dot / badge on chat tabs in the strip when that tab has at least one pending `control:permission`.
- A topbar live-pill state badge (extending `live-pill-popover`) when its session has pending permission.
- (Optional) A subtle toast `"Permission request from <project>/<branch>"` with click-to-jump.

## Decision

**Defer / close** as not needed in current form. Re-open as `permission-pending-indicator` if the per-tab visibility gap becomes a real pain point. The "modal" design from F.html offers no concrete benefit over the existing inline card.

Moving on to the next changes (`split-chat`, `git-pane-writes`, `terminal-panel`).
