## Context

Current `generateTitleIfNeeded` in `packages/server/src/socket/handlers/message.ts:266`:

```ts
async function generateTitleIfNeeded(channelId, ch) {
  const pendingPrompt = ch.pendingTitlePrompt;
  if (!pendingPrompt) return;

  ch.pendingTitlePrompt = undefined;
  try {
    const res = await ch.sendRequest('session:generate_title', { description: pendingPrompt });
    const parsed = controlGenerateTitleResponseSchema.safeParse(res.response);
    if (!parsed.success) return;
    const { title } = parsed.data;
    ch.title = title;
    sessionStore.renameByChannelId(channelId, title)
      .catch((e) => logger.warn({ err: e }, 'Failed to persist session title'));
    channelManager.broadcastSessionState(channelId, 'idle', title);
  } catch (e) {
    logger.error({ err: e }, 'Failed to generate session title');
  }
}
```

Three concerns live in one function. The fire-and-forget `.catch` on persistence is correct (don't block the UI), but it is easy to misread as "persistence and broadcast are sequential" when they're really parallel.

## Goals / Non-Goals

**Goals:**
- Name each side effect (request / persist / broadcast) so its contract is visible.
- Keep the orchestrator short (≤10 lines) and self-describing.
- Preserve exact log messages, log levels, and control-flow order.

**Non-Goals:**
- Changing the CLI protocol event, request/response schema, or `Channel` API.
- Making persistence blocking (it is deliberately non-blocking).
- Introducing retry logic or circuit breaking.

## Decisions

### Extract `requestTitle(ch, prompt): Promise<string | null>`

Wraps the CLI round-trip and zod validation. Returns `null` on invalid response (current behaviour); throws on CLI error (orchestrator logs).

- Alternative — return `Result<title, error>`. Rejected: project does not use `Result` as a general pattern here; `null` is the established idiom for "no valid title to propagate".

### Extract `persistTitle(channelId, title): void`

Synchronous call that fires the promise and attaches the warn-level `.catch`. Void return keeps callers from accidentally awaiting it — preserving the fire-and-forget contract.

### Extract `broadcastTitle(channelId, title): void`

Thin wrapper over `channelManager.broadcastSessionState`. Exists to pair with `persistTitle` and make the orchestrator read as a three-line recipe.

### Keep the top-level try/catch in the orchestrator

The outer `try` catches CLI errors; the helpers never throw the kinds of errors that need swallowing inside the helpers themselves. Keeping the catch at the orchestrator avoids duplicating logging.

## Risks / Trade-offs

- [Order-of-operations regression] Persistence and broadcast currently both fire after successful parse. The broadcast happens synchronously after the persistence `.catch` is attached, so the broadcast can arrive client-side before the DB write completes. → This is the current behaviour and is intentional (DB write is fire-and-forget). Refactor must preserve it — do not `await` the persistence promise.
- [Helper proliferation for one call site] Each helper is called once. → Accepted: the naming is the entire point; inlining puts the responsibility names back into comments, which rot faster.

## Migration Plan

Internal refactor, single PR, no flag.

## Open Questions

None.
