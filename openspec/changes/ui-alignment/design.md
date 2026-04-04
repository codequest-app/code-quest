## Context

分 7 個 phase 逐步對齊，每個 phase 完成後停下讓用戶確認 UI。Phase 1（Permission Prompt）先做。

## Goals / Non-Goals

**Goals:**
- 視覺和互動行為對齊 extension v2.1.45
- TDD：FakeClaude + real JSON + testing-library
- 每個 phase 獨立可測試

**Non-Goals:**
- Session sidebar（cc-office 架構不同，用 TabBar）
- Teleport dialog（沒有 teleport 功能）
- Debugger/Notebook banners（VS Code specific）

## Decisions

### Phase 1: Permission Prompt

Extension 結構（F5 CSS module）：
```
permissionRequestContainer (border, rounded-lg, relative, flex-col)
├── permissionRequestContainerBackground (absolute inset-0, bg)
├── permissionRequestContent (z-1)
│   ├── permissionRequestHeader (bold, "Do you want to proceed with <toolName>?")
│   ├── permissionPath (monospace, file path)
│   ├── permissionRequestDescription
│   │   └── <details>
│   │       ├── <summary> "Details" + chevron
│   │       └── <pre class="inputJson"> JSON.stringify(inputs, null, 2)
│   └── skillNote (optional)
├── buttonContainer (flex-col, gap-8)
│   ├── button.primary "① Yes" / "① Yes, and auto-accept"
│   ├── button "② Yes, allow for session" (with destination dropdown)
│   ├── button "③ No" / "No, keep planning"
│   └── rejectMessageInput "Tell Claude what to do instead"
└── keyboardHints "Esc to cancel"
```

鍵盤行為：
- 數字鍵 1/2/3 直接觸發對應按鈕
- Arrow Up/Down 移動焦點（data-focused-index）
- Enter 觸發當前焦點按鈕
- Esc 取消（deny）
- 焦點按鈕有 highlighted 背景

cc-office 目前的 ToolPermissionBanner 已有 keyboard shortcuts（數字鍵 + Esc），但 layout 是 banner 風格而非 dialog 風格。需要改 layout 和添加 details/chevron。

## Risks / Trade-offs

- [大量 UI 變更] → 分 phase，每步確認
- [OptionButton 可能廢棄] → 如果 Permission prompt 不再用，但 PlanReviewBanner 可能還用
