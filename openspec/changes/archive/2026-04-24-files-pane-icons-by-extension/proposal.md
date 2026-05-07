## Why

`FileTree` renders the same outline `<DocumentIcon>` for every file regardless of type — TypeScript, JSON, Markdown, images all look identical. The mockup (`docs/prototype/F.html` / shared.css) and the reference Claude Code VS Code Extension both use distinct per-extension icons, which is one of the lowest-effort UX wins for any file tree.

## What Changes

- Add `@iconify/react` + `@iconify-json/material-icon-theme` to `apps/web`. Material Icon Theme is the same icon pack VS Code's most-used icon theme uses (Apache 2.0); Iconify lets us tree-shake to only the icons we map.
- Add a small `getFileIcon(name)` helper that returns an Iconify icon name based on (1) full filename match (e.g. `package.json`, `tsconfig.json`, `Dockerfile`, `.gitignore`), then (2) extension match (`.ts`, `.tsx`, `.json`, `.md`, `.css`, `.svg`, image types, …), then (3) generic `material-icon-theme:file` fallback.
- Replace `<DocumentIcon>` in `FileTree` with `<Icon icon={getFileIcon(name)} />` at the same `w-4 h-4` size.
- Folder icon stays as a chevron (open/closed state); per-folder icons (e.g. `folder-src`, `folder-test`) are out of scope for v1 — the chevron carries the expand/collapse affordance and folder-type icons add visual noise without operational value.

Explicitly out of scope:
- Per-folder icons (`folder-src`, `folder-node`, etc.) — visual polish for a future change.
- User-configurable icon themes — single hard-coded mapping for now.
- Custom icons for git status (the existing `git-mark-*` badge handles that).

## Capabilities

- **files-pane**: file rows render an extension-appropriate icon instead of a single generic document glyph.
