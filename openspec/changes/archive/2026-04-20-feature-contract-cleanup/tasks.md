## 1. Low-risk type cleanup

- [x] 1.1 Remove `ChannelFeature` interface; inline `id: string` into `Feature`, `SlashCommandFeature`, `MenuItemFeature`
- [x] 1.2 Rename `SlashCommandFeature` → `SlashCommandView` across all imports
- [x] 1.3 Rename `MenuItemFeature` → `MenuItemView` across all imports
- [x] 1.4 Run tests + typecheck + biome; commit

## 2. Split `feature.ts` by concern

- [x] 2.1 Extract `deriveGroupAggregate` to `lib/derive-group-aggregate.ts`; update 3 importers (trailing-renderers + FeatureRow)
- [x] 2.2 ~~Move `PALETTE_TABS` + `PaletteTab` to palette~~ — skipped: would force lib→components dependency inversion; type stays in `feature.ts`
- [x] 2.3 Verify `feature.ts` now contains only types + `FEATURE_SECTIONS` const
- [x] 2.4 Run tests + typecheck + biome; commit

## 3. Split `trailing-renderers.tsx` per surface

- [x] 3.1 Promote `TriStateIndicator` to `components/ui/TriStateIndicator.tsx`
- [x] 3.2 Move `renderMenuTrailing` into `to-menu-item.tsx` (fold inline)
- [x] 3.3 Move `renderPaletteTrailing` into `to-palette-command.tsx` (fold inline)
- [x] 3.4 Delete `lib/adapters/trailing-renderers.tsx` and its test file (redistribute tests to the two adapter test files)
- [x] 3.5 Run tests + typecheck + biome; commit

## 4. Registry + builder consolidation

- [x] 4.1 Extract private `findSlash(predicate)` helper in `feature-registry.ts`; rewrite `findSlashCommand` and `getSlashCommand` to use it
- [x] 4.2 Lift `buildSection` out of `buildMenuItems()` to module level
- [x] 4.3 Run tests + typecheck + biome; commit

## 5. Relocate surface-specific files out of `lib/`

- [x] 5.1 Move `lib/adapters/to-palette-command.tsx` → `components/palette/to-palette-command.tsx`; update importer
- [x] 5.2 Create `components/command-menu/` directory
- [x] 5.3 Move `components/CommandMenu.tsx` → `components/command-menu/CommandMenu.tsx`; update imports from outside
- [x] 5.4 Move `lib/build-menu-items.ts` → `components/command-menu/build-menu-items.ts`; update imports + test location
- [x] 5.5 Move `lib/menu-layout.ts` → `components/command-menu/menu-layout.ts`; update imports + test location
- [x] 5.6 Run tests + typecheck + biome; commit

## 6. Remove view types; expose `Feature[]` from registry

- [x] 6.1 Narrow `FeatureRegistry` interface: remove `getSlashCommandFeatures()` and `getMenuItemFeatures()`; keep `getFeatures(): Feature[]`, `register()`, `findSlashCommand()`, `getSlashCommand()` (latter two can return `Feature | undefined` reading `.slash`)
- [x] 6.2 Update `buildMenuItems` to map `Feature[]` through `toMenuItem` inline instead of reading pre-adapted `MenuItemView[]`
- [x] 6.3 Update slash command consumers to read `feature.slash?.command` / `.slash?.invoke` directly
- [x] 6.4 Delete `SlashCommandView` and `MenuItemView` type exports from `feature.ts`
- [x] 6.5 Run tests + typecheck + biome; commit

## 7. Final verification

- [x] 7.1 Full test suite green
- [x] 7.2 Typecheck clean
- [x] 7.3 Biome clean
- [x] 7.4 Manual sanity check: CommandMenu opens via button + via "/"; CommandPalette tabs switch; filter groups toggle
