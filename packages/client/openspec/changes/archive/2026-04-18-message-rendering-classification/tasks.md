## 1. Fixtures

- [x] 1.1 Capture a real skill-body user event into `packages/summoner/src/__fixtures__/claude/real/user-skill-body.jsonl` (one line from `raw_entries` starting with `Base directory for this skill:`)
- [x] 1.2 Capture or synthesise a `<system-reminder>` user event into `packages/summoner/src/__fixtures__/claude/synthetic/user-system-reminder.jsonl`
- [x] 1.3 Ensure an existing typed-user fixture (`user-text.jsonl`) is available for the `source='typed'` baseline; add one if missing

## 2. Transform (summoner) — TDD

- [x] 2.1 Write failing test in `packages/summoner/src/__tests__/claude/transforms/user.test.ts` asserting skill-body input → payload `source='skill'`
- [x] 2.2 Add failing test: system-reminder input → `source='reminder'`
- [x] 2.3 Add failing test: plain typed input → `source='typed'`
- [x] 2.4 Add regression test: string `<command-message>` content → transform still returns `null`
- [x] 2.5 Implement classification in `packages/summoner/src/claude/transforms/user.ts` (single helper `classifyUserSource(blocks)` + `startsWith` checks); run tests green
- [x] 2.6 Thread `source` through `buildMessagePayload` (or next to it) without changing its existing callers' shape

## 3. Shared schema — TDD

- [x] 3.1 Add failing schema test in `packages/shared` (or adjacent unit test) asserting `source` accepts `'typed'|'skill'|'command'|'reminder'` and is optional
- [x] 3.2 Extend `packages/shared/src/schemas/message.ts` user payload with `source: z.enum([...]).optional()`; run tests green
- [x] 3.3 Re-export the type if needed so `packages/client` can consume it

## 4. Client types and handler — TDD

- [x] 4.1 Extend `packages/client/src/types/ui.ts` `OptionalMetaMap['text']` with `source?: 'typed'|'skill'|'command'|'reminder'`
- [x] 4.2 Write failing test(s) in `packages/client/src/contexts/channel/handlers/__tests__/message.test.tsx` (or closest existing test file) asserting `meta.source` is propagated from `message:user` payload to `Message.meta`
- [x] 4.3 Update the user-message handler to pass `payload.source` through to `meta.source`; run tests green

## 5. Client rendering — TDD

- [x] 5.1 Write failing test in `packages/client/src/components/__tests__/ChatMessage.test.tsx`: `role='user', type='text', meta.source='typed', content='1. a 2. b'` → no `<ol>`/`<li>`, no `<strong>`, raw text present
- [x] 5.2 Add failing test: `meta.source='skill'` with `# Heading\n\n**bold**` → `<h1>` and `<strong>bold</strong>` present
- [x] 5.3 Add failing test: `meta.source='command'` → `renderBody` returns `null` (no DOM for the content area)
- [x] 5.4 Add failing test: `meta.source='reminder'` → `renderBody` returns `null`
- [x] 5.5 Add regression test: `role='assistant', type='text'` with markdown → still renders via `MarkdownContent` regardless of `meta.source`
- [x] 5.6 Implement dispatch in `packages/client/src/components/MessageContent.tsx` (`pickUserTextRenderer(source)` helper); run tests green

## 6. Skill tool body — TDD

- [x] 6.1 Write failing test in `ChatMessage.test.tsx`: `tool_use` with `content='Skill'`, `meta.input.skill='opsx:propose'`, `meta.result.content='Hello **world**\n\n- a\n- b'` → after expand, DOM has `<strong>world</strong>` and two `<li>`
- [x] 6.2 Write failing test: `tool_use` with `content='Skill'` and no `meta.result` → shows invoked skill id header and "Running…" indicator
- [x] 6.3 Implement `case 'Skill'` + `SkillToolBody` in `packages/client/src/components/message-blocks/ToolUseBlock.tsx` using `MarkdownContent`; run tests green

## 7. Copy parity with extension

Extension webview surfaces a copy affordance on exactly three targets
(`src/webview/core/main.js` L80271-80344, L81217): every fenced code block,
the Bash tool IN row, and a right-click "Copy Link" context menu on markdown
links. cc-office already covers the first two (via `CodeBlock` + `ToolBlock`
`copyText`); the remaining gaps are (a) fenced blocks without a language
hint and (b) the "Copy Link" context menu.

- [x] 7.1 Write failing test: MarkdownContent with a fenced code block lacking a language (```` ```\ncode\n``` ````) → rendered DOM contains a copy button
- [x] 7.2 Adjust `CodeBlock` / `MarkdownContent` so fenced blocks always get a copy button (even when `language` is undefined), while keeping **inline** `<code>` unchanged (no copy)
- [x] 7.3 Write failing test: right-clicking an `<a>` rendered by MarkdownContent opens a "Copy Link" menu; clicking it writes the href via `navigator.clipboard.writeText`
- [x] 7.4 Implement a small `LinkContextMenu` (mirroring extension's `_6717`) and wire it into MarkdownContent's `a` component override; keep left-click behaviour (open link) intact
- [x] 7.5 Confirm existing `CodeBlock` / `ToolBlock` copy tests still pass and no duplicate buttons appear in nested scenarios

## 7b. Post-apply fixes

- [x] 7b.1 Fix duplicate copy button on language-tagged fenced code blocks (MarkdownContent's `pre` wrapper + `CodeBlock` both render one)
- [x] 7b.2 Add per-message copy button for non-user, non-tool messages (`assistant` text/thinking + `system` error/result/etc.), excluding `tool_use`/`tool_result`/`pending_action`/`action_result`/`image`/`document`; visible on hover, copies rendered text content

## 8. Regression and polish

- [x] 8.1 Run `pnpm -C packages/summoner test` (TDD suite for transforms)
- [x] 8.2 Run `pnpm -C packages/client test` (ChatMessage + handler tests + full suite)
- [x] 8.3 Run `pnpm -C packages/server test` to confirm no payload-schema regressions
- [x] 8.4 Run `biome check` on all touched files
- [x] 8.5 Manually verify in dev: (a) typed "1. 史萊姆 2. DQ 3. 要保留" renders literal, (b) Skill invocation shows rendered markdown body, (c) assistant response with headings/bullets unchanged, (d) no regression on existing tool blocks (Bash/Read/Write), (e) code block copy and Copy Link context menu work

## 9. Ship

- [x] 9.1 Commit with message summarising per-file changes and spec reference
- [x] 9.2 Push feature branch and open PR (or push to main per project convention); link OpenSpec change in PR body
