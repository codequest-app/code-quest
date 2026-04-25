## Why

`packages/client/src/components/SpecPane.tsx` renders each Active change row as a `<button>` (open modal) containing a nested `<span role="button">` (Archive). HTML forbids nesting interactive elements inside a `<button>`; the file already carries a `biome-ignore` comment self-acknowledging the invalid markup. Screen-reader behavior on nested interactive elements is undefined, and keyboard tab order can skip the inner control. This is an accessibility / HTML-validity bug, not a code-organization concern.

We considered fixing it by promoting the `<li>` itself into a fake button (`onClick` + `role="button"` + `tabIndex={0}` + manual keyboard handling) so the inner Archive button stays a real `<button>` (Approach B), and rejected it: that just replaces nested-button with self-built-button — the same a11y category of problem, plus all the manual keyboard wiring.

## What Changes

- Restructure the Active change row in `SpecPane.tsx` (Approach A — accept the minor UX shift):
  - The `<li>` becomes a non-interactive flex container that owns the row's hover effect.
  - One sibling `<button>` wraps the emoji + name (with `flex-1` so the click target spans the row middle) and opens the change modal.
  - One sibling `<button>` for Archive (rendered when the change is `ready`); no longer needs `e.stopPropagation()` or `role="button"`.
  - The Ready badge and task pill become non-interactive sibling `<span>`s.
- Remove the `biome-ignore` comments that previously silenced the invalid nesting.
- "Click anywhere on the row" UX shrinks to "click the name area." Most users click the name anyway; the difference is invisible in practice and the cost is acceptable for valid HTML.

Explicitly out of scope:
- No new subcomponent extraction (this is a localized restructure, not an SRP refactor).
- No changes to the modal contents or the archive-confirmation dialog.
- No visual restyle beyond what's needed to keep two sibling buttons looking like the current row.

## Capabilities

- **client-spec-pane**: Active change rows MUST NOT nest interactive elements; the open-modal action and the Archive action are sibling `<button>` elements within a non-interactive `<li>` container.
