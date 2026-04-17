# error-feedback

## Problem

Two silent failure points where users get no feedback:
1. `SessionRow` rename failure — `console.warn`, user assumes it succeeded
2. `useSpeechToText` error — `console.error`, user doesn't know why mic stopped working

## Proposed Change

Replace both `console.warn/error` calls with `toast.error()` using the existing `sonner` library already installed in the project.

Also document the error handling convention so future contributors know the rule.

## Convention

| Error type | Handler |
|---|---|
| React render throw | `ErrorBoundary` → inline fallback card |
| User action async failure | `toast.error('What failed')` |
| Background / fire-and-forget | `console.error` (dev only) |
| Pure function throw | Let it propagate, don't catch |

## Scope

- `packages/client/src/components/SessionRow.tsx` — rename failure
- `packages/client/src/hooks/useSpeechToText.ts` — speech recognition error
