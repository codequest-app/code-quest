## 1. Summoner — add fromInput

- [x] 1.1 RED: write failing test — `transformUser` sets `fromInput: true` for normal user echo; `false` for `isSynthetic`; `false` for `parent_tool_use_id`
- [x] 1.2 GREEN: add `fromInput?: boolean` to `messageUserPayloadSchema`; set `fromInput = !isSynthetic && !parent_tool_use_id` in `transformUser`

## 2. Client — propagate fromInput through history

- [x] 2.1 RED: write failing test — `buildMessagesFromHistory` propagates `fromInput` from payload to `meta`
- [x] 2.2 GREEN: add `fromInput` to `historyUserSchema`; pass it through `messagesFromUserBlock` into `meta`

## 3. Client — add fromInput to TextMeta

- [x] 3.1 Add `fromInput?: boolean` to `TextMeta` in `packages/client/src/types/ui.ts`

## 4. Client — sendMessage belt-and-suspenders

- [x] 4.1 `sendMessage` sets `meta.fromInput: true` for new messages before CLI echo arrives

## 5. Client — ArrowUp filter

- [x] 5.1 RED: write failing test — ArrowUp skips messages where `fromInput` is not `true` (loop wakeup, skill injection); fix test to use `click(textarea)` first so ArrowUp actually reaches the handler
- [x] 5.2 GREEN: update filter in `ComposeInput.tsx` to `meta.fromInput === true`

## 6. Remove source — confirm usages

- [x] 6.1 Audit all `source` usages — confirmed all are either replaced by `fromInput` or safe to delete

## 7. Remove source

- [x] 7.1 Remove `source` from `transformUser`
- [x] 7.2 Remove `userSourceSchema`, `UserSource`, `source` from `messageUserPayloadSchema`
- [x] 7.3 Remove `source` from `historyUserSchema`
- [x] 7.4 Remove `source` from `TextMeta` and `UserSource` import in client types
- [x] 7.5 Remove `source` propagation from `applyUserContent`; pass `fromInput` instead
- [x] 7.6 Simplify `renderUserText` in `MessageContent.tsx` — always return `message.content`
- [x] 7.7 Remove `preserveWhitespace` source check in `ChatMessage.tsx` — always `whitespace-pre-wrap`
- [x] 7.8 Update all test files that referenced `source`

## 8. Full suite

- [x] 8.1 Full test suite passes — summoner 502, client 1915, all GREEN
