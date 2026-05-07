## Tasks

### 1. Audit current consumers
- [ ] `grep -rn "var(--color-[a-z]+-rgb)" apps/web/src` — list every reference grouped by token name. Confirm:
  - `accent-rgb`: inline style + mode-accent re-export → keep
  - `shadow-rgb`: tw-prose-kbd-shadows → keep
  - `text-rgb`: EffortSwitch (className arbitrary) → migrate
  - `button-rgb`: mode-accent re-export → keep
  - `border-rgb`: any consumer? → likely drop
  - `hover-tint-rgb`: any consumer? → likely drop

### 2. EffortSwitch className migration (TDD)
- [ ] Update test to expect `bg-text/35` (was `bg-[rgba(...)]`).
- [ ] `EffortSwitch.tsx` line 93: `bg-[rgba(var(--color-text-rgb),0.35)]` → `bg-text/35`. Visual sanity: toggle handle background unchanged.

### 3. Drop unused tokens
- [ ] Remove any `--color-X-rgb` with zero remaining consumers from `@theme` block in `App.css`.
- [ ] Update the comment block documenting the surviving categories.

### 4. Skill update
- [ ] `.claude/skills/tailwind-v4/SKILL.md`: existing "RGB-split → opacity modifier" guidance grows the inline-style + mode-shadow exception list.

### 5. Verification
- [ ] Full client `pnpm vitest run` green.
- [ ] `openspec validate rgb-split-token-cleanup --strict`.
