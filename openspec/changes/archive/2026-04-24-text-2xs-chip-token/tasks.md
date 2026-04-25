## Tasks

### 1. Token (Red → Green)
- [ ] Add `--text-2xs: 0.625rem;` to `@theme` in `packages/client/src/App.css`. Place near other text-related tokens (sort by category).
- [ ] Verify Tailwind v4 generates the `text-2xs` utility (manual check: render a div with `text-2xs` and confirm computed `font-size: 10px`).

### 2. SpecPane chips (TDD)
- [ ] Tests for `Ready` / `Archive` / task pill assert `toHaveClass('text-2xs')` (replace existing `text-xs` assertions if any).
- [ ] Edit `SpecPane.tsx`: change `text-xs` → `text-2xs` on the three chip elements only.
- [ ] Re-run SpecPane tests → green.

### 3. section-label cleanup
- [ ] In `App.css` `@utility section-label`, change `font-size: 10px;` → `font-size: var(--text-2xs);`.
- [ ] Visual sanity: section headings (Active changes / Specs / sidebar Projects label) unchanged.

### 4. Skill update
- [ ] `.claude/skills/tailwind-v4/SKILL.md`: in the existing arbitrary-text callout, append "exception: chip-style uppercase tracked badges use the dedicated `text-2xs` (10 px) token; do NOT use `text-[10px]` arbitrary".

### 5. Verification
- [ ] Full client `pnpm vitest run` green.
- [ ] `openspec validate text-2xs-chip-token --strict`.
- [ ] Manual smoke: SpecPane chips visually subordinate to change names; section labels look identical.
