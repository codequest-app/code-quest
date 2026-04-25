## Tasks

### 1. Dependencies
- [ ] `pnpm --filter @code-quest/client add @iconify/react @iconify-json/material-icon-theme`

### 2. `getFileIcon` helper (TDD in `packages/client`)
- [ ] Test: filename match wins over extension (e.g. `package.json` → npm icon, not generic JSON).
- [ ] Test: extension match returns the right Iconify name (`.ts`, `.tsx`, `.json`, `.md`, `.css`, `.svg`, `.png`).
- [ ] Test: unknown extension returns the fallback `material-icon-theme:file`.
- [ ] Test: case-insensitive extension match (`README.MD` → markdown icon).
- [ ] Implementation: `utils/getFileIcon.ts` with two maps (`BY_FILENAME`, `BY_EXTENSION`) + fallback.

### 3. FileTree integration (TDD)
- [ ] Test: file row renders an Iconify `<svg>` (data-icon attribute) matching the lookup.
- [ ] Refactor: replace `<DocumentIcon>` with `<Icon icon={getFileIcon(name)} className="w-4 h-4" />`.
- [ ] Verify directory rows still render the chevron (existing FileTree tests should stay green without modification).

### 4. Verification
- [ ] Full client test suite green.
- [ ] `openspec validate files-pane-icons-by-extension --strict`.
- [ ] Manual smoke: open a project with mixed file types, verify icons differentiate.
