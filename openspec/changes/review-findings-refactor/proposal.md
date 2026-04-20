## Why

A full-production code review (all 425 `.ts/.tsx` files across client/server/summoner/shared, tests excluded) surfaced a handful of concrete, low-risk cleanup opportunities: a few long or multi-responsibility functions, magic numbers that should be named constants, duplicate patterns worth extracting, and a handful of stale schema-style decisions. Each finding is small on its own, but together they add up — handling them as one change keeps the branch history clean and lets us apply the TDD discipline (expect-invariant refactor) uniformly.

No behavior changes. This is a pure refactor; every existing test must still pass unchanged.

## What Changes

Grouped by package (details in `design.md` / `tasks.md`):

**server/src/**
- Split `Channel` class into focused collaborators (`ControlRequestTracker`, `NotificationTracker`) — prep for future work, keeps current public API identical
- Extract helpers from `handlers/session/connect.ts#finalizeAndNotify` (settings application vs broadcast)
- Extract helpers from `handlers/terminal.ts#handleOpenClaude` (cwd resolution vs channel creation)

**summoner/src/**
- `claude/transforms/control.ts`: replace nested ternaries with switch/table lookups
- `filesystem/local.ts#extractDirectories`: use `split()`-based implementation instead of nested `indexOf` loops
- `git/local.ts#checkoutWithFallback`: flatten 3-level try/catch cascade, document strategy order

**shared/src/**
- Audit `z.looseObject()` usages across `schemas/*` — keep only where truly needed; switch remaining to `z.object()` + explicit `.passthrough()` at call sites
- Extract `channelIdPayloadBase` from `schemas/message-stream.ts` (6 identical schemas) and reuse
- Remove verified-unused exports from `schemas/common.ts`

**client/src/**
- `components/ComposeInput.tsx`: extract `NAV_KEYS_COMPOSE` constant (currently duplicated at lines 176, 357)
- `utils/format-relative-date.ts` + `format-reset-time.ts`: share time-unit constants via new `utils/time-constants.ts`
- `utils/tool-registry.ts`: name `60` / `80` magic slice-lengths as constants
- `utils/message-preview.ts`: move hard-coded preview color hex values to Tailwind theme tokens where possible

## Capabilities

### New Capabilities

_None — refactor only._

### Modified Capabilities

_None — no spec-level behavior changes; all existing requirements remain unchanged._

## Impact

- **Code**: `packages/{client,server,summoner,shared}/src/` — see `tasks.md` for file-level list
- **Tests**: No test deletions or `expect` changes. New helpers may gain unit tests where the extracted unit was not previously covered in isolation.
- **APIs**: No public API changes. `Channel` class surface stays identical post-refactor (tracker classes are internal).
- **Dependencies**: None
