## Context

`ProtocolMessage` 和 `ClientMessage` type rename 已完成。但函數名、參數名、interface field 仍有 `Event` 殘留。這是純 rename 重構，不改行為。

## Goals / Non-Goals

**Goals:**
- 所有引用 `ClientMessage` 的函數名、參數名、變數名統一為 `message` 語系
- 所有引用 `ProtocolMessage` 的變數名統一為 `protocolMessage`
- `AdapterOutput.events` → `AdapterOutput.messages`
- transform 函數名去掉 `Event` 後綴

**Non-Goals:**
- 不改 emitter event name（`client_message` 已經正確）
- 不改 test helper `toClientMessage`（已經正確）
- 不改 socket event name strings（`session:init` 等）

## Decisions

### 1. 按 dependency 順序改

shared → summoner/types → summoner/transforms → summoner/adapter → summoner/runner → server → client。每改一層跑一次測試。

### 2. 變數名用 `message` 不用 `msg`

保持一致性，完整拼寫。

### 3. transform 函數名去 `Event` 但保留 `transform` prefix

`transformAssistantEvent` → `transformAssistant`（不是 `transformAssistantMessage`，因為參數型別已標示）。

## Risks / Trade-offs

- [blast radius 大] → 按層拆 task，每層跑測試
- [AdapterOutput.events → messages 影響所有 consumer] → 這是最大的 rename，但 TypeScript 會抓到所有遺漏
