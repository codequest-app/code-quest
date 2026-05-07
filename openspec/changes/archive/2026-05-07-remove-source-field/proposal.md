## Why

`meta.source` on user messages was designed to classify message origin (`typed` / `skill` / `command` / `reminder`), but the classification is unreliable: it depends on CLI signals (`isSynthetic`) that are not consistently set (e.g. loop wakeup prompts lack `isSynthetic`, causing them to be misclassified as `typed`). The field drives UI decisions (ArrowUp history, render style, whitespace) that are therefore also incorrect. `reminder` has never been assigned. `command` is under-populated.

## What Changes

- **BREAKING** Remove `source` from `messageUserPayloadSchema`, `historyUserSchema`, `TextMeta`, and all related types
- Remove `source` derivation from `transformUser` in summoner
- Remove `source` propagation from `applyUserContent` and `messagesFromUserBlock`
- Replace ArrowUp filter (`source === 'typed'`) with `meta.fromInput: true` flag set exclusively by `sendMessage`
- Remove `renderUserText` branching on `source` — all user text messages render the same way (plain text with `whitespace-pre-wrap`)
- Remove `preserveWhitespace` branch in `ChatMessage` that depended on `source`
- Skill body messages (`isSynthetic: true`) continue to be visible, collapsed by existing `TruncatedContent`

## Capabilities

### New Capabilities

- `user-input-marker`: A `meta.fromInput: true` flag set only by `sendMessage`, used as the sole ArrowUp history filter — reliable because it is set client-side at the moment of user submission, never by CLI replay paths

### Modified Capabilities

- `chat-input-history`: ArrowUp filter changes from `source === 'typed' || source === undefined` to `meta.fromInput === true`

## Impact

- `packages/shared/src/schemas/message-payloads.ts` — remove `source` from schemas
- `packages/shared/src/schemas/message.ts` — remove `UserSource` type and `TextMeta.source`
- `apps/summoner/src/claude/transforms/user.ts` — remove `source` derivation
- `apps/web/src/contexts/channel/handlers/message.ts` — remove `source` propagation, add `fromInput` in `sendMessage`
- `apps/web/src/utils/message.ts` — remove `source` from `messagesFromUserBlock`
- `apps/web/src/components/chat/compose/ComposeInput.tsx` — update ArrowUp filter
- `apps/web/src/components/chat/conversation/MessageContent.tsx` — remove source-based branching
- `apps/web/src/components/chat/conversation/ChatMessage.tsx` — remove `preserveWhitespace` source check
