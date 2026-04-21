## Context

`mcp.ts` currently has two classes of handlers:

**Factory-built (5):** `handleReconnect`, `handleToggle`, `handleServers`, `handleSetServers`, `handleMessage`. Each is one call to `createRequestHandler(schema, event, errorMessage)`. The factory passes `result` through to the callback unchanged.

**Hand-written (3):** `handleAuthenticate`, `handleClearAuth`, `handleOAuthCallback`. Each copies the factory's try/catch/parse/sendRequest skeleton and adds a response-shape translation:

```ts
if (result.success) {
  cb?.(ok({ authUrl: String(result.response?.authUrl ?? '') || undefined }));
} else {
  cb?.(err(result.error ?? 'Authentication failed'));
}
```

The three differ only in the `mapSuccess` expression (`{ authUrl }`, `{}`, `{}`) and the default failure message. Everything else is duplicated.

## Goals / Non-Goals

**Goals:**
- One construction pattern for all eight MCP handlers.
- Adding an auth-style handler becomes a one-liner.
- Zero change in user-visible behaviour (error messages, response shapes, log output).

**Non-Goals:**
- Generalising the factory beyond mcp.ts (other handler files have different shapes — out of scope).
- Touching the CLI control protocol event names (`mcp:authenticate`, etc).
- Adding retry / timeout / cancellation behaviour.

## Decisions

### Extend `createRequestHandler` with `mapSuccess` and optional `failureMessage`

```ts
function createRequestHandler<T extends z.ZodObject<z.ZodRawShape>>(opts: {
  schema: T;
  event: string;
  errorMessage: string; // prefix for thrown-exception wrapping
  mapParsed?: (parsed: z.infer<T>) => Record<string, unknown>;
  mapSuccess?: (response: unknown) => Record<string, unknown>;
  failureMessage?: string; // default when result.error is empty
}) { … }
```

When `mapSuccess` is provided:
- On `result.success === true` → `cb?.(ok(mapSuccess(result.response)))`.
- On `result.success === false` → `cb?.(err(result.error ?? failureMessage ?? errorMessage))`.

When `mapSuccess` is absent (existing callers): preserve current behaviour — pass `result` through to `cb` directly.

- Alternative — two separate factories. Rejected: branching inside one factory is simpler than keeping two near-identical ones in sync.
- Alternative — convert the positional signature to an options bag for all callers. Rejected in scope: existing 5 handlers already pass positional args cleanly; switching them is churn. But the new signature accepts an options bag; existing positional calls are migrated to the options bag as part of the refactor since it's a single edit per site.

### Preserve exact error messages

The three hand-written handlers use:
- `'Invalid payload'` (on schema failure in the `catch` block)
- `'Authentication failed'` / `'Clear auth failed'` / `'OAuth callback failed'` (on CLI `result.success === false` with no `result.error`)

The factory's `errorMessage` is used for the Zod catch, matching `'Invalid payload'`. Each migrated handler supplies its own `failureMessage`.

## Risks / Trade-offs

- [Factory signature change] Moving from positional args to options bag touches the 5 existing factory-built handlers. → Acceptable: all in the same file, one commit, no external callers.
- [Over-generalisation] Future contributors may try to stretch the factory for non-auth-style response shapes. → Document `mapSuccess`'s contract in a short comment on the factory; keep the factory mcp-local for now.

## Migration Plan

Single PR:
1. Extend the factory with `mapSuccess` + `failureMessage` and switch to an options-bag signature.
2. Rewrite the 5 existing factory calls to the new signature.
3. Replace the 3 hand-written handlers with factory calls.
4. Run mcp tests + full server suite.

Rollback: revert the PR; no state / schema / protocol changed.

## Open Questions

None.
