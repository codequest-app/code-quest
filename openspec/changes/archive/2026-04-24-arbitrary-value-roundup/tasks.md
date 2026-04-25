## Tasks

### 1. Broaden the guard test (Red)
- [ ] Rename `utils/__tests__/no-arbitrary-text.test.ts` → `no-arbitrary-utility.test.ts`. Pattern matches `\b\w+-\[(\d+px|\d*\.\d+px)\]` literal-pixel arbitraries; allow-list categories (`calc`, `min`, `max`, `var`, vh/vw/dvh, em, `data-*`, `backdrop-blur-[2px]` documented exception) are ignored. Run → confirms 8 offenders.

### 2. Bulk replace (Green)
- [ ] `text-[13px]` → `text-xs` in ProjectCard, TopScopeSwitcher.
- [ ] `text-[12px]` → `text-xs` in WorktreeRow.
- [ ] `h-[38px]` → `h-9` in WorkspaceTopbar.
- [ ] `ring-[rgba(0,0,0,0.2)]` → `ring-black/20` in EffortSwitch.
- [ ] `max-h-[480px]` × 4 → `max-h-120` in DiffModal, FilePreviewModal (×2), SpecModal.
- [ ] `max-w-[180px]` → `max-w-45` in TopScopeSwitcher.
- [ ] Re-run guard test → 0 offenders.

### 3. Verification
- [ ] Full client `pnpm vitest run` green.
- [ ] Skill update (tailwind-v4): expand the existing arbitrary callout from "text-[10px]/[11px] only" to **all `\w+-[Npx]` literal-pixel arbitraries**, with the legitimate-exception list (calc/min/max/var/vh/vw/em/data-*).
- [ ] `openspec validate arbitrary-value-roundup --strict`.
