# consolidate-zod-shared

## Why

After tighten-production-casts, an inventory revealed:

- **71 production `interface`** declarations across packages. Most are correctly TS-only (React contexts, service interfaces, DI containers), but **~15 are wire/data shapes** that should be zod schemas living in `@code-quest/shared`.
- **9 inline zod schemas in client/server** that parse wire data — these duplicate or fragment what should be canonical shared schemas.
- `@code-quest/shared/index.ts` (430 lines) and `schemas/index.ts` (422 lines) re-export everything via flat barrel — no domain grouping; many entries are dead exports nobody imports.
- Existing `shared/schemas/` already has 27 files split by domain (auth, session, message, mcp, etc.) — good base, but inconsistencies remain after the unify-rpc-ack pass.

## What Changes

Six-step pass with TDD safety net (full test suite green at each step boundary):

1. **Inventory & classify**: produce a definitive list of which interfaces stay TS-only vs. should be zod-in-shared. Captured in tasks.md table.

2. **Convert & move wire-data interfaces to shared as zod**:
   - client `*Meta` types, `ChannelState`/`ConfigState`/`FileSnapshot` data fields → shared zod (only the wire-portion; UI-only context state stays in client)
   - summoner `InitializeOptions`, `ResolvedControlResponse` → shared zod
   - server `SessionConfig`, `SessionInitConfig`, internal context-usage shapes → shared zod (consolidate with existing `contextUsageDataSchema`)

3. **Refactor existing shared zod**:
   - Consolidate duplicates (e.g. multiple `usage` shapes across settings/message)
   - Tighten loose `Record<string, unknown>` where strict is feasible
   - Replace remaining `z.looseObject` with `z.object().passthrough()` only when actually needed

4. **First re-export cleanup**:
   - Drop dead exports from `shared/index.ts` and `shared/schemas/index.ts` (use `tsc --noEmit` + grep to find unimported names)
   - Switch from name-by-name re-exports to `export * from './schemas/<file>.ts'` where the entire file's exports are needed

5. **Reorganize shared/schemas/ by domain**:
   - Verify each file's content matches its domain (e.g. session.ts has session schemas only, not response schemas mixed in)
   - Split overflowing files (session.ts has 350+ lines; consider splitting session-payload, session-response, session-state)
   - Merge fragmented files where they form one concept

6. **Final re-export cleanup**:
   - Re-run dead-export sweep after reorganization
   - Update consumers' import paths if files moved

## Impact

- Shared package becomes the single source of truth for wire/data shapes
- Server/client/summoner stop defining wire schemas locally
- Re-export bloat: `shared/index.ts` ~430 lines → expected ~150 lines, organized by domain comment
- `@code-quest/shared` import statements in consumers shorter/more grouped
- Better discoverability: each schema lives where its domain says
- No behavior change. All migrations are TS-typed; tests catch regression.
