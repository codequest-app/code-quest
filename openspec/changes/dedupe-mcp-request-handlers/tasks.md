## 1. Baseline

- [x] 1.1 Run `pnpm --filter @code-quest/server exec vitest run src/__tests__/mcp.test.ts` and confirm green baseline.

## 2. Extend the factory

- [x] 2.1 Change `createRequestHandler` signature from positional args to an options bag `{ schema, event, errorMessage, mapParsed?, mapSuccess?, failureMessage? }`.
- [x] 2.2 When `mapSuccess` is absent, preserve current behaviour (pass `result` to `cb` unchanged).
- [x] 2.3 When `mapSuccess` is present: on success call `cb?.(ok(mapSuccess(result.response)))`; on failure call `cb?.(err(result.error ?? failureMessage ?? errorMessage))`.

## 3. Migrate factory-built handlers

- [x] 3.1 Rewrite `handleReconnect`, `handleToggle`, `handleServers`, `handleSetServers`, `handleMessage` to use the options-bag signature. No behaviour change.

## 4. Replace hand-written handlers with factory

- [x] 4.1 `handleAuthenticate` → `createRequestHandler({ schema: mcpAuthenticatePayloadSchema, event: EVENTS.mcp.authenticate, errorMessage: 'Invalid payload', mapSuccess: (r) => ({ authUrl: String(r?.authUrl ?? '') || undefined }), failureMessage: 'Authentication failed' })`.
- [x] 4.2 `handleClearAuth` → factory call with `mapSuccess: () => ({})`, `failureMessage: 'Clear auth failed'`.
- [x] 4.3 `handleOAuthCallback` → factory call with `mapSuccess: () => ({})`, `failureMessage: 'OAuth callback failed'`, `mapParsed` to forward `{ serverName, callbackUrl }`.

## 5. Verification

- [x] 5.1 `pnpm --filter @code-quest/server exec vitest run src/__tests__/mcp.test.ts` — all green, no `expect` modified.
- [x] 5.2 Full server suite green.
- [x] 5.3 Grep `mcp.ts` — no remaining try/catch/sendRequest/cb skeleton outside the factory.
