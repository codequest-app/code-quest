## ADDED Requirements

### Requirement: File rows render an extension-appropriate icon

Each file row in `FileTree` SHALL render a leading icon chosen by the file's filename or extension. The lookup MUST resolve in this order: (1) exact filename match (e.g. `package.json` → JSON-with-Node-style icon), (2) extension match (e.g. `.ts` → TypeScript icon), (3) generic file-icon fallback. Folder rows continue to use the chevron expand/collapse icon — per-folder type icons are not part of this change.

#### Scenario: TypeScript file
- **WHEN** a file row is rendered for `foo.ts`
- **THEN** the leading icon is the TypeScript icon from the chosen icon set

#### Scenario: Filename match wins over extension
- **WHEN** a file row is rendered for `package.json`
- **THEN** the leading icon is the package-specific icon, not the generic JSON icon

#### Scenario: Unknown extension falls back to generic
- **WHEN** a file row is rendered for `mystery.xyz`
- **THEN** the leading icon is the generic file icon (no error / blank)

#### Scenario: Folder row keeps chevron
- **WHEN** a directory row is rendered
- **THEN** the leading icon is the existing expand/collapse chevron, not a folder-type icon
