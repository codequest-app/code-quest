## Tasks

### 1. Guard test (Red)
- [ ] Add a single grep-style assertion test (`utils/__tests__/no-arbitrary-text.test.ts`) that walks `apps/web/src/components/*.tsx`, scans for `text-\[1[01]px\]`, and fails listing any matches. Run → confirms 27 matches across 16 files.

### 2. Bulk replace (Green)
- [ ] `sed`-style replace `text-[10px]` → `text-xs` and `text-[11px]` → `text-xs` across the 16 component files.
- [ ] Re-run guard test → expects 0 matches.

### 3. Test suite verification (no expect drift)
- [ ] Full client `pnpm vitest run` green. Any test that asserted the old class via regex (e.g. `toMatch(/text-\[10px\]/)`) must be updated to `text-xs` — equivalent contract, not a relaxation.

### 4. Skill update
- [ ] Edit `.claude/skills/tailwind-v4/SKILL.md` (Design flow: token-first section): add a callout that **`text-[10px]` and `text-[11px]` are explicitly disallowed — collapse to `text-xs`**. List the chip-heaviness mitigation tactics (tracking-wider, bg/10, lower-contrast color).

### 5. Visual sanity (manual)
- [ ] Open the running dev server; eyeball SpecPane Ready/Archive chips, GitPane upstream badge, NewChangeDialog hint text, ProjectCard worktree count badge — confirm no jarring visual regressions.

### 6. Verification
- [ ] `openspec validate text-arbitrary-cleanup --strict`.
