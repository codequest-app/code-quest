## 1. Shared types

- [x] 1.1 Add `chat:ask_side_question` payload schema and RPC types to `packages/shared`

## 2. Server RPC handler

- [x] 2.1 Add `handleAskSideQuestion` handler in `apps/server/src/socket/handlers/message.ts` — calls `ch.sendRequest('message:side_question', { question })` and returns `RpcResult<{ answer: string }>` via callback
- [x] 2.2 Register `chat:ask_side_question` event on emitter
- [x] 2.3 Write server test: successful side_question returns answer; null response returns error

## 3. Client context action

- [x] 3.1 Add `askSideQuestion(question: string): Promise<RpcResult<{ answer: string }>>` to `ChannelMessagesContext` — emits `chat:ask_side_question` via socket

## 4. SideQuestionDialog component

- [x] 4.1 Create `SideQuestionDialog.tsx` — absolute overlay within ChatPanel, `max-w-[600px] w-full mx-auto mt-[15vh]`, shows loading / answer / error states
- [x] 4.2 Render answer with `<MarkdownContent content={answer} />`
- [x] 4.3 Dismiss on Escape key and on backdrop click
- [x] 4.4 Write component test: shows loading → renders markdown answer; shows error on failure; closes on Escape

## 5. /btw slash command

- [x] 5.1 Add `/btw` item to `command-menu-items.tsx` — disabled when question text is empty, `onSelect` calls `askSideQuestion` with text after `/btw `
- [x] 5.2 Write command menu test: `/btw hello` is enabled and triggers askSideQuestion; `/btw` alone is disabled

## 6. ChatPanel wiring

- [x] 6.1 Add `SideQuestionDialog` overlay to `ChatPanel.tsx` — controlled by `{ open, question, answer, loading, error }` local state
- [x] 6.2 Pass `onAskSideQuestion` down from ChatPanel to ChatInputArea → CommandMenu (or use context action directly)

## 7. Branch & git

- [x] 7.1 Create branch `feat/side-question` and verify all tests pass
