## Why

The `feature-adapter-refactor` branch is functionally complete but two code-review rounds surfaced structural debt in the Feature contract and its adapter layer: `lib/feature.ts` mixes types with logic (`deriveGroupAggregate`) and with palette-surface concerns (`PALETTE_TABS`); `lib/adapters/trailing-renderers.tsx` handles two surfaces in one file; `lib/` hosts files that only one UI surface consumes (`build-menu-items.ts`, `menu-layout.ts`, `to-palette-command.tsx`); and the `ChannelFeature` abstraction, `SlashCommandFeature`/`MenuItemFeature` naming, and duplicate registry lookup methods add cognitive load without value. Cleaning this up now — while the feature-adapter contract is fresh — keeps the lib/ directory honest about what is "cross-surface shared" vs "surface-specific".

## What Changes

### Internal (behavior-preserving refactor)
- Remove `ChannelFeature` abstraction; inline `id: string` into each interface
- Lift `buildSection` helper out of `buildMenuItems()` to module level
- Merge `FeatureRegistry.findSlashCommand` + `getSlashCommand` via internal helper
- Extract `deriveGroupAggregate()` from `feature.ts` to its own module
- Move `PALETTE_TABS` / `PaletteTab` from `feature.ts` to palette domain
- Split `trailing-renderers.tsx` per-surface: menu renderer → merged into `to-menu-item.tsx`; palette renderer → merged into `to-palette-command.tsx`; shared `TriStateIndicator` → `components/ui/`
- Relocate surface-specific files out of `lib/`:
  - `lib/adapters/to-palette-command.tsx` → `components/palette/`
  - `lib/build-menu-items.ts` → `components/command-menu/`
  - `lib/menu-layout.ts` → `components/command-menu/`
  - `components/CommandMenu.tsx` → `components/command-menu/CommandMenu.tsx`
- Rename `SlashCommandFeature` → `SlashCommandView`, `MenuItemFeature` → `MenuItemView` to reflect their role as adapter projections (not feature definitions)
- Remove `SlashCommandView` / `MenuItemView` types entirely: registry exposes raw `Feature[]`; consumers read `.slash` / `.menuItem` directly

All refactors are behavior-preserving. Tests stay green without modification to `expect` assertions.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
(none — pure internal restructure; no spec requirements change)

## Impact

- **Code**: `packages/client/src/lib/` (shrinks to cross-surface primitives only); `packages/client/src/components/` gains `command-menu/` subdirectory mirroring `palette/` pattern; ~25 files see import-path updates
- **APIs**: `FeatureRegistry` interface narrows (removes `getSlashCommandFeatures()` and `getMenuItemFeatures()`); all current registry consumers updated in the same change
- **Tests**: no expect changes; only import paths update
- **Risk**: medium — broad import churn, but behavior-preserving; CI catches regressions
