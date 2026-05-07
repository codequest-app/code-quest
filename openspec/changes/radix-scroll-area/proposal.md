## Why

Replace custom-styled `overflow-auto` containers with `@radix-ui/react-scroll-area` for consistent cross-browser scrollbar styling and improved accessibility.

Extracted from `migrate-ui-to-radix-extras` (collapsible + tooltip already done).

## What Changes

- Audit scroll containers across the codebase (session list, file list, sidebar panels)
- Install `@radix-ui/react-scroll-area`
- Migrate candidates to `ScrollArea.Root` + `ScrollArea.Viewport` + `ScrollArea.Scrollbar` + `ScrollArea.Thumb`
- Verify no conflicts with virtualized lists (TanStack Virtual)

## Risks

- ScrollArea may affect virtualized lists — verify `measureElement` refs still work
- Custom scrollbar CSS may need to be removed after migration
