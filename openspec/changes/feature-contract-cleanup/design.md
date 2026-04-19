## Context

The `feature-adapter-refactor` branch introduced a unified `Feature` shape plus per-surface adapters (`toMenuItem`, `toSlashCommand`, `toPaletteCommand`). Two code-review rounds on the branch flagged structural debt that is best resolved before merge, while authors remember the design intent. This cleanup is purely structural — behavior, public component props, and channel contracts are unchanged.

**Current state (problem):**
- `lib/` hosts both cross-surface primitives (`feature.ts`, `feature-registry.ts`, `open-signal.ts`, `create-choice-feature.ts`) and surface-specific files with one consumer each (`build-menu-items.ts`, `menu-layout.ts`, `adapters/to-palette-command.tsx`)
- `feature.ts` (127 lines) mixes types, a pure function (`deriveGroupAggregate`), and palette-only constants (`PALETTE_TABS`)
- `adapters/trailing-renderers.tsx` (134 lines) handles menu AND palette trailing render in one file via a shared private component
- `ChannelFeature` interface carries a single `id: string` field — abstraction without value
- `SlashCommandFeature` / `MenuItemFeature` types are adapter *projections* but their names read like feature variants; consumers pattern-match on `.command` vs `.menuItem.label` flattened fields
- `FeatureRegistry.findSlashCommand` + `getSlashCommand` share loop-and-match structure

## Goals / Non-Goals

**Goals:**
- `lib/` contains only cross-surface primitives after this change
- `components/command-menu/` mirrors existing `components/palette/` pattern (surface + helpers + tests colocated)
- Each source file's contents match its filename (no mixed-concern files)
- Registry exposes `Feature[]` directly; adapter projections are a component-layer concern
- Every refactor step ships with tests green and no `expect` modifications

**Non-Goals:**
- No new behavior or features
- No changes to component props or runtime channel contracts
- No changes to `Feature` shape itself (only interfaces around it)
- No Storybook/visual regression baseline updates beyond mechanical import-path edits

## Decisions

### 1. Remove `ChannelFeature`; inline `id: string`

`ChannelFeature` is a 1-field marker interface. Extending it adds an inheritance hop without shared behavior. Inlining makes each interface self-contained; `id: string` appearing three times is clearer than chasing the parent type.

**Alternative:** keep as marker — rejected; the marker serves no runtime or structural purpose.

### 2. Remove `SlashCommandView` / `MenuItemView` types entirely (also renamed from `*Feature`)

Original types were adapter outputs but named like feature kinds. Two-step migration:
1. First rename `SlashCommandFeature` → `SlashCommandView`, `MenuItemFeature` → `MenuItemView` to signal "projection" semantics
2. Then remove the types: registry exposes raw `Feature[]`; surface-specific code (`CommandMenu` via `buildMenuItems`, `CommandPalette` via its own list) reads `.slash?.command` / `.menuItem?.label` directly

Net effect: no intermediate view type leaks across module boundaries; adapters remain as local helpers inside the surface that needs them.

**Alternative:** keep the types for type-narrowing at call sites — rejected; `Feature.slash` being optional already carries the narrowing, and consumers handle the optionality trivially.

### 3. Split `trailing-renderers.tsx` per surface

Current file is a kitchen sink keyed on FeatureState kind with two public entry points:
- `renderMenuTrailing` → fold into `to-menu-item.tsx` (sole caller)
- `renderPaletteTrailing` → fold into `to-palette-command.tsx` (sole caller)
- Private `TriStateIndicator` → promote to `components/ui/TriStateIndicator.tsx` (used by both renderers after split)

After split, each adapter file owns its surface's rendering; `TriStateIndicator` becomes a reusable UI primitive.

### 4. Relocate surface-specific files out of `lib/`

| From | To | Reason |
|---|---|---|
| `lib/adapters/to-palette-command.tsx` | `components/palette/` | Sole consumer is `palette/FeatureRow.tsx` |
| `lib/build-menu-items.ts` | `components/command-menu/` | Sole consumer is `CommandMenu.tsx` |
| `lib/menu-layout.ts` | `components/command-menu/` | Sole consumer is `CommandMenu.tsx` |
| `components/CommandMenu.tsx` | `components/command-menu/CommandMenu.tsx` | Colocate with its helpers (mirrors `components/palette/` pattern) |

### 5. Lift `buildSection` out of `buildMenuItems`

Currently an inline closure. Promoting to module-level improves readability and enables unit-testing the section builder in isolation (not required, but possible).

### 6. Merge `findSlashCommand` + `getSlashCommand` via internal helper

Both methods iterate `entries`, call `slashOf(f)`, then apply a predicate. Extract a private `findSlash(predicate)` closure; each public method becomes a thin predicate + delegation.

### 7. Migration order (implementation sequence)

1. Low-risk type cleanup: remove `ChannelFeature`, rename `*Feature` views
2. `feature.ts` content splits: extract `deriveGroupAggregate`, move `PALETTE_TABS`
3. Trailing-renderers split
4. Registry method consolidation + `buildSection` lift
5. File relocations (touches most imports; do last for clean diff)
6. Remove `SlashCommandView` / `MenuItemView` types (depends on step 5 relocations being settled)

Each step: run full test suite + typecheck + biome before committing.

## Risks / Trade-offs

- **[Risk] Large import churn from relocations (step 5)** → Mitigation: do the move mechanically (one file at a time), run tests between each. Pre-commit hooks catch missed edits.
- **[Risk] Removing view types breaks downstream TypeScript narrowing** → Mitigation: accept the `Feature.slash?` optionality; pattern is already established for `Feature.state?`. Adjust each call site explicitly rather than via cast.
- **[Trade-off] Two renames for the same types (SlashCommandFeature → View → removal)** → Accepted: renaming first clarifies intent in the intermediate commit, then the removal is a natural follow-up once callers have migrated their mental model.
- **[Trade-off] `components/command-menu/` creates a new subdirectory** → Accepted: it makes palette vs command-menu symmetric, which is the whole point.
