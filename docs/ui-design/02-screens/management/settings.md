# Settings Screen - 設定

**Category**: Management Screens
**Access**: Keyboard shortcut `Esc` → Settings, Gear icon in top bar
**Last Updated**: 2026-02-05

---

## Overview

The Settings screen provides comprehensive configuration options for the RPG-CLI system, including general preferences, audio settings, display options, keyboard shortcuts, AI model configuration, and permission management.

---

## ASCII Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️ 設定 - Settings                               [✕] 關閉  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [一般] [音效] [顯示] [快捷鍵] [AI模型] [權限] [關於]      │
│                                                             │
│  ━━━━━━━━━━━━━━━ 一般設定 ━━━━━━━━━━━━━━━                │
│                                                             │
│  🌐 語言 (Language)                                        │
│  ┌─────────────────────────────────────┐                   │
│  │ 繁體中文 (Traditional Chinese)  ▼  │                   │
│  └─────────────────────────────────────┘                   │
│  選項: 繁體中文, 简体中文, English, 日本語                 │
│                                                             │
│  🎨 主題 (Theme)                                           │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐                          │
│  │🌙 │  │☀️ │  │🎯 │  │🔮 │                          │
│  │暗色│  │亮色│  │自動│  │自訂│                          │
│  └────┘  └────┘  └────┘  └────┘                          │
│  當前: 暗色                                                 │
│                                                             │
│  💾 自動存檔                                               │
│  ☑ 啟用自動存檔                                            │
│  存檔間隔: [5分鐘 ▼]                                       │
│  最後存檔: 3分鐘前                                          │
│  [立即存檔]                                                │
│                                                             │
│  🎮 RPG化程度                                              │
│  最小 ▂▂▂▂████▂▂ 最大                                    │
│         ↑ 80%                                              │
│  • 更多RPG元素和動畫效果                                    │
│  • 需要重啟應用以完全生效                                   │
│                                                             │
│  🔔 通知設定                                               │
│  ☑ 戰鬥勝利通知                                            │
│  ☑ 技能冷卻完成通知                                        │
│  ☑ 等級提升通知                                            │
│  ☐ 成就解鎖通知                                            │
│  ☐ 每日登入獎勵提醒                                        │
│                                                             │
│  ━━━━━━━━━━━━━━━ 數據管理 ━━━━━━━━━━━━━━━                │
│                                                             │
│  📊 遊戲數據                                               │
│  已使用空間: 15.2 MB / 100 MB                              │
│  ████░░░░░░ 15%                                            │
│                                                             │
│  [🗑️ 清除快取]  [📦 導出數據]  [📥 匯入數據]             │
│                                                             │
│  ⚠️ 危險區域                                              │
│  [重置為預設值]  [刪除所有數據]                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Esc] 關閉  |  [R] 重置  |  [S] 儲存  |  [?] 幫助        │
└─────────────────────────────────────────────────────────────┘
```

---

## Audio Tab (音效設定)

```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️ 設定 - 音效                                   [✕] 關閉  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [一般] [音效] [顯示] [快捷鍵] [AI模型] [權限] [關於]      │
│                                                             │
│  ━━━━━━━━━━━━━━━ 音效設定 ━━━━━━━━━━━━━━━                │
│                                                             │
│  🔊 主音量                                                 │
│  ▂▄▆███████ 75%                                            │
│  [測試]                                                    │
│                                                             │
│  🎵 背景音樂 (BGM)                                         │
│  ☑ 啟用背景音樂                                            │
│  音量: ▂▄▆███░░░░ 60%                                     │
│  [測試]                                                    │
│                                                             │
│  曲目選擇:                                                  │
│  ┌─────────────────────────────────────┐                   │
│  │ 城鎮主題 - Town Theme            ▼ │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  🔔 音效 (SFX)                                             │
│  ☑ 啟用音效                                                │
│  音量: ▂▄▆█████░░░ 70%                                    │
│                                                             │
│  分類音量:                                                  │
│  • UI音效:     ▂▄▆████░░░░ 65%  [測試]                    │
│  • 戰鬥音效:   ▂▄▆█████░░░ 75%  [測試]                    │
│  • 技能音效:   ▂▄▆██████░░ 80%  [測試]                    │
│  • 通知音效:   ▂▄▆███░░░░░ 50%  [測試]                    │
│                                                             │
│  🎤 語音                                                   │
│  ☐ 啟用語音提示 (實驗性功能)                               │
│  語音角色: [女性 ▼]                                        │
│  語音速度: ▂▄▆████░░░░ 100%                               │
│                                                             │
│  🔇 快速靜音                                               │
│  ☐ 主靜音 (Mute All) - 快捷鍵: M                          │
│  ☐ 專注模式 (僅保留重要通知)                               │
│                                                             │
│  [儲存設定]  [重置為預設]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Display Tab (顯示設定)

```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️ 設定 - 顯示                                   [✕] 關閉  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [一般] [音效] [顯示] [快捷鍵] [AI模型] [權限] [關於]      │
│                                                             │
│  ━━━━━━━━━━━━━━━ 顯示設定 ━━━━━━━━━━━━━━━                │
│                                                             │
│  🎬 動畫效果                                               │
│  ☑ 啟用動畫效果                                            │
│                                                             │
│  動畫速度: ▂▄▆████░░░░ 100%                               │
│  (較慢 ←────────→ 較快)                                   │
│                                                             │
│  ☐ 減少動畫 (效能模式)                                     │
│  ☐ 遵循系統設定 (prefers-reduced-motion)                   │
│                                                             │
│  💬 文字顯示                                               │
│  打字機效果速度: ▂▄▆██████░░ 50ms/字                      │
│  (即時 ←────────→ 慢速)                                   │
│  [預覽效果]                                                │
│                                                             │
│  字體大小:                                                  │
│  ○ 小 (12px)                                               │
│  ◉ 中 (14px) - 預設                                        │
│  ○ 大 (16px)                                               │
│  ○ 超大 (18px)                                             │
│                                                             │
│  行距: ▂▄▆████░░░░ 1.5                                    │
│                                                             │
│  🎨 視覺效果                                               │
│  ☑ 粒子效果 (技能施放、升級等)                             │
│  ☑ 發光效果 (稀有物品、Buff等)                             │
│  ☑ 螢幕震動效果 (戰鬥、暴擊等)                             │
│  ☑ 浮動數字 (傷害、治療、經驗值)                           │
│                                                             │
│  特效品質:                                                  │
│  ○ 低 (省電模式)                                           │
│  ◉ 中 (平衡)                                               │
│  ○ 高 (最佳視覺體驗)                                       │
│                                                             │
│  🌈 色彩設定                                               │
│  色盲模式:                                                  │
│  ┌─────────────────────────────────────┐                   │
│  │ 無 (標準色彩)                    ▼ │                   │
│  └─────────────────────────────────────┘                   │
│  選項: 無, 紅色盲, 綠色盲, 藍色盲, 全色盲                  │
│                                                             │
│  對比度: ▂▄▆████░░░░ 標準                                 │
│  飽和度: ▂▄▆████░░░░ 100%                                 │
│                                                             │
│  ♿ 無障礙                                                 │
│  ☐ 高對比模式                                              │
│  ☐ 大按鈕模式 (觸控優化)                                   │
│  ☐ 移除閃爍效果 (光敏性癲癇保護)                           │
│  ☐ 顯示所有文字標籤 (圖標加文字)                           │
│                                                             │
│  [儲存設定]  [重置為預設]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Keyboard Shortcuts Tab (快捷鍵設定)

```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️ 設定 - 快捷鍵                                 [✕] 關閉  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [一般] [音效] [顯示] [快捷鍵] [AI模型] [權限] [關於]      │
│                                                             │
│  ━━━━━━━━━━━━━━━ 快捷鍵設定 ━━━━━━━━━━━━━━━              │
│                                                             │
│  [搜尋快捷鍵...]                    [重置全部] [匯出/匯入]  │
│                                                             │
│  📋 系統快捷鍵                                             │
│                                                             │
│  打開設定           [Esc]                    [編輯]        │
│  快速儲存           [Ctrl+S]                 [編輯]        │
│  關閉視窗           [Esc]                    [編輯]        │
│  切換全螢幕         [F11]                    [編輯]        │
│  開啟幫助           [?]                      [編輯]        │
│                                                             │
│  🎮 遊戲操作                                               │
│                                                             │
│  角色狀態           [C]                      [編輯]        │
│  技能管理           [K]                      [編輯]        │
│  背包               [I]                      [編輯]        │
│  夥伴管理           [P]                      [編輯]        │
│  地圖               [M]                      [編輯]        │
│  任務日誌           [J]                      [編輯]        │
│                                                             │
│  ⚔️ 戰鬥快捷鍵                                             │
│                                                             │
│  使用技能1          [Ctrl+1]                 [編輯]        │
│  使用技能2          [Ctrl+2]                 [編輯]        │
│  使用技能3          [Ctrl+3]                 [編輯]        │
│  使用技能4          [Ctrl+4]                 [編輯]        │
│  使用技能5          [Ctrl+5]                 [編輯]        │
│  使用技能6          [Ctrl+6]                 [編輯]        │
│  使用技能7          [Ctrl+7]                 [編輯]        │
│  使用技能8          [Ctrl+8]                 [編輯]        │
│  使用技能9          [Ctrl+9]                 [編輯]        │
│                                                             │
│  召喚夥伴           [A]                      [編輯]        │
│  使用道具           [U]                      [編輯]        │
│  逃跑               [R]                      [編輯]        │
│                                                             │
│  🏪 商店快捷鍵                                             │
│                                                             │
│  技能商店           [1]                      [編輯]        │
│  工匠鋪             [2]                      [編輯]        │
│  魔法圖書館         [3]                      [編輯]        │
│  傭兵公會           [4]                      [編輯]        │
│  寶物庫             [5]                      [編輯]        │
│  訓練場             [6]                      [編輯]        │
│  錢莊               [7]                      [編輯]        │
│  酒館               [H]                      [編輯]        │
│  公會大廳           [G]                      [編輯]        │
│  靜止之間           [Tab]                    [編輯]        │
│                                                             │
│  ⚠️ 快捷鍵衝突檢測: 無衝突                                │
│                                                             │
│  [儲存設定]  [重置為預設]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## AI Model Tab (AI模型設定)

```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️ 設定 - AI模型                                 [✕] 關閉  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [一般] [音效] [顯示] [快捷鍵] [AI模型] [權限] [關於]      │
│                                                             │
│  ━━━━━━━━━━━━━━━ AI 模型設定 ━━━━━━━━━━━━━━━             │
│                                                             │
│  🤖 預設模型                                               │
│  ┌─────────────────────────────────────┐                   │
│  │ Claude Sonnet 4.5                ▼ │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  可用模型:                                                  │
│  • Claude Opus 4.5    - 最強大，適合複雜任務              │
│  • Claude Sonnet 4.5  - 平衡性能與成本 ✅ 推薦             │
│  • Claude Haiku 4.0   - 快速便宜，適合簡單任務            │
│  • Gemini Pro         - Google模型，多語言支援             │
│  • GPT-4             - OpenAI模型，通用能力強              │
│                                                             │
│  💰 成本管理                                               │
│  每日預算: [$5.00]                                         │
│  本日已用: $0.42  ████░░░░░░ 8.4%                         │
│  本月已用: $12.50 ████░░░░░░ 25%                          │
│                                                             │
│  超出預算時:                                                │
│  ◉ 自動切換到便宜模型 (Gemini/Haiku)                       │
│  ○ 停止使用AI功能                                          │
│  ○ 僅警告，繼續使用                                        │
│                                                             │
│  💵 計費統計                                               │
│                                                             │
│  本月使用明細:                                              │
│  • Claude Sonnet:  $8.20  (67次調用) ████████░░          │
│  • Gemini Pro:     $2.10  (156次調用) ███░░░░░░░          │
│  • Claude Opus:    $2.20  (8次調用)  ██░░░░░░░░           │
│                                                             │
│  [查看詳細帳單]                                            │
│                                                             │
│  ⚡ 智能模型選擇                                           │
│  ☑ 啟用智能路由 (根據任務自動選擇最佳模型)                 │
│                                                             │
│  任務類型對應:                                              │
│  • 簡單對話 → Haiku/Gemini                                │
│  • 代碼生成 → Sonnet                                       │
│  • 代碼審查 → Sonnet/Opus                                  │
│  • 架構設計 → Opus                                         │
│  • Bug修復  → Sonnet                                       │
│                                                             │
│  🔐 API 金鑰管理                                           │
│                                                             │
│  Anthropic (Claude):                                       │
│  [••••••••••••••••••••••••••]  ✅ 已驗證                   │
│  [更新金鑰]                                                │
│                                                             │
│  Google (Gemini):                                          │
│  [••••••••••••••••••••••••••]  ✅ 已驗證                   │
│  [更新金鑰]                                                │
│                                                             │
│  OpenAI (GPT):                                             │
│  [尚未設定]  ⚠️ 未驗證                                     │
│  [設定金鑰]                                                │
│                                                             │
│  [儲存設定]  [測試連接]                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Permissions Tab (權限設定)

```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️ 設定 - 權限                                   [✕] 關閉  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [一般] [音效] [顯示] [快捷鍵] [AI模型] [權限] [關於]      │
│                                                             │
│  ━━━━━━━━━━━━━━━ 工具權限管理 ━━━━━━━━━━━━━━━            │
│                                                             │
│  🔐 權限預設 (Presets)                                     │
│                                                             │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐          │
│  │🔴 嚴格 │  │🟡 標準 │  │🟢 寬鬆 │  │🔧 自訂 │          │
│  │        │  │   ✅   │  │        │  │        │          │
│  └────────┘  └────────┘  └────────┘  └────────┘          │
│                                                             │
│  嚴格: 僅允許讀取操作，禁止所有寫入和執行                   │
│  標準: 允許大部分操作，需確認敏感操作 (推薦)               │
│  寬鬆: 允許所有操作，無需確認 (謹慎使用)                   │
│  自訂: 手動配置每項權限                                    │
│                                                             │
│  ━━━━━━━━━━━━━━━ 詳細權限 ━━━━━━━━━━━━━━━                │
│                                                             │
│  📁 檔案系統                                               │
│  ☑ 讀取檔案                                                │
│  ☑ 寫入檔案                                                │
│  ☐ 刪除檔案 (需確認)                                       │
│  ☑ 建立目錄                                                │
│  ☐ 刪除目錄 (需確認)                                       │
│                                                             │
│  限制路徑:                                                  │
│  僅允許存取: [專案目錄內]                                   │
│  ☑ 禁止存取系統目錄 (/System, C:\Windows)                 │
│  ☑ 禁止存取家目錄敏感資料夾 (Documents, Downloads)         │
│                                                             │
│  🔧 命令執行                                               │
│  ☑ 執行 Git 命令                                           │
│  ☑ 執行 npm/yarn 命令                                      │
│  ☑ 執行測試命令                                            │
│  ☐ 執行建構命令 (需確認)                                   │
│  ☐ 執行任意 Shell 命令 (需確認)                            │
│                                                             │
│  白名單命令:                                                │
│  git, npm, yarn, pnpm, node, python, pytest, jest         │
│  [編輯白名單]                                              │
│                                                             │
│  🌐 網路存取                                               │
│  ☑ 讀取網頁 (HTTP GET)                                     │
│  ☑ API 呼叫 (HTTP POST)                                    │
│  ☐ 下載檔案                                                │
│  ☐ 上傳檔案                                                │
│                                                             │
│  允許的網域:                                                │
│  • *.github.com                                            │
│  • *.googleapis.com                                        │
│  • *.npmjs.com                                             │
│  [編輯網域白名單]                                          │
│                                                             │
│  🗄️ 資料庫存取                                            │
│  ☑ 讀取資料庫                                              │
│  ☐ 寫入資料庫                                              │
│  ☐ 修改結構 (DDL)                                          │
│                                                             │
│  🔔 通知                                                   │
│  ☑ 顯示系統通知                                            │
│  ☐ 播放音效                                                │
│                                                             │
│  ━━━━━━━━━━━━━━━ 安全設定 ━━━━━━━━━━━━━━━                │
│                                                             │
│  🛡️ 確認選項                                              │
│  ☑ 執行危險命令前確認 (rm, drop, delete等)                │
│  ☑ 存取敏感檔案前確認 (.env, credentials等)               │
│  ☑ 網路請求前顯示目標網址                                  │
│  ☐ 每次操作都詢問 (最高安全性)                             │
│                                                             │
│  📝 操作日誌                                               │
│  ☑ 記錄所有工具使用                                        │
│  保留時長: [30天 ▼]                                        │
│  [查看日誌]  [匯出日誌]                                    │
│                                                             │
│  [儲存設定]  [重置為預設]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## About Tab (關於)

```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️ 設定 - 關於                                   [✕] 關閉  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [一般] [音效] [顯示] [快捷鍵] [AI模型] [權限] [關於]      │
│                                                             │
│  ━━━━━━━━━━━━━━━ 關於 RPG-CLI ━━━━━━━━━━━━━━━            │
│                                                             │
│                        🎮                                   │
│                                                             │
│              RPG-CLI (Claude Code RPG)                      │
│                    Version 1.0.0                            │
│                                                             │
│         "讓 AI 協作變成一場冒險"                            │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  📦 系統資訊                                               │
│  版本: v1.0.0                                               │
│  建置日期: 2026-02-05                                       │
│  環境: Production                                           │
│  平台: darwin (macOS)                                       │
│  Node版本: v20.11.0                                         │
│                                                             │
│  🔄 更新                                                   │
│  目前版本: v1.0.0 ✅ 最新版本                               │
│  [檢查更新]                                                │
│                                                             │
│  上次檢查: 1小時前                                          │
│                                                             │
│  ☑ 自動檢查更新                                            │
│  ☐ 自動下載更新                                            │
│                                                             │
│  📄 授權                                                   │
│  授權類型: MIT License                                      │
│  [查看完整授權]                                            │
│                                                             │
│  👥 開發者                                                 │
│  專案網站: https://github.com/your-org/rpg-cli             │
│  文檔: https://docs.rpg-cli.dev                            │
│  問題回報: https://github.com/your-org/rpg-cli/issues      │
│                                                             │
│  💬 社群                                                   │
│  Discord: https://discord.gg/rpg-cli                       │
│  Twitter: @rpgcli                                          │
│                                                             │
│  ❤️ 感謝                                                   │
│  • Anthropic (Claude AI)                                   │
│  • Google (Gemini AI)                                      │
│  • OpenAI (GPT)                                            │
│  • 所有貢獻者和社群成員                                    │
│                                                             │
│  [💰 贊助專案]  [⭐ 給個星星]                              │
│                                                             │
│  ━━━━━━━━━━━━━━━ 法律資訊 ━━━━━━━━━━━━━━━                │
│                                                             │
│  [隱私政策]  [服務條款]  [開源授權]                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Component References

### Tab Navigation
【參考：04-components/tabs.md】
- Horizontal tab bar
- Active tab indicator
- Keyboard navigation (Left/Right arrows)
- Smooth slide animation

### Sliders
【參考：04-components/slider.md】
- Volume sliders
- RPG level slider
- Animation speed slider
- Live preview on change

### Checkboxes
【參考：04-components/checkbox.md】
- Standard checkboxes
- Toggle switches for binary options
- Indeterminate state for partial selections
- Disabled state

### Dropdowns
【參考：04-components/dropdown.md】
- Language selector
- Theme selector
- Model selector
- Keyboard navigation

### Theme Switcher
【參考：04-components/theme-switcher.md】
- Dark/Light/Auto/Custom themes
- Visual preview cards
- Smooth transition on change
- System preference detection

---

## States & Interactions

### Setting States

1. **Default (Unchanged)**
   - Normal appearance
   - No save indicator
   - Can be reset

2. **Modified (Unsaved)**
   - Yellow dot indicator
   - "Unsaved changes" banner
   - Save button enabled

3. **Saved**
   - Green checkmark animation
   - "Settings saved" toast
   - Reset button enabled

4. **Error**
   - Red border on invalid input
   - Error message below field
   - Save button disabled

5. **Loading**
   - Spinner on save/load
   - Disabled inputs
   - Progress indicator

### Keyboard Interactions

```
Esc          - Close settings (with unsaved warning)
S            - Save settings
R            - Reset current tab
Tab          - Next input field
Shift+Tab    - Previous input field
Space        - Toggle checkbox/switch
Enter        - Confirm button/dropdown
Arrow keys   - Adjust sliders
←/→          - Switch tabs
?            - Show help tooltip
```

### Mouse Interactions

```
Click Tab        - Switch tab
Click Slider     - Adjust value
Drag Slider      - Fine-tune value
Click Checkbox   - Toggle option
Click Dropdown   - Show options
Hover Setting    - Show tooltip
Click [Test]     - Play sound/preview
Click [Reset]    - Reset to default
Click [Save]     - Save all changes
```

### Touch Interactions (Mobile)

```
Tap Tab          - Switch tab
Tap Slider       - Set value
Drag Slider      - Adjust value
Tap Checkbox     - Toggle
Tap Dropdown     - Show options
Long press       - Show help tooltip
Swipe Left/Right - Switch tabs
```

---

## Animations

### Tab Transition
【參考：01-design-system/animation-timing.md】

```
0.0s  ├─ Current tab fade out (150ms)
0.1s  ├─ Tab indicator slide (200ms)
0.2s  ├─ New tab fade in (200ms)
```

### Setting Change Feedback

**Slider Animation:**
```css
.slider-thumb {
  transition: transform 100ms ease, box-shadow 200ms ease;
}

.slider-thumb:active {
  transform: scale(1.2);
  box-shadow: 0 0 0 8px rgba(99, 102, 241, 0.2);
}
```

**Checkbox Toggle:**
```css
@keyframes checkbox-check {
  0% {
    transform: scale(0) rotate(-45deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(-45deg);
  }
  100% {
    transform: scale(1) rotate(-45deg);
    opacity: 1;
  }
}

.checkbox-check {
  animation: checkbox-check 200ms ease-out;
}
```

**Save Success:**
```css
@keyframes save-success {
  0% {
    transform: scale(1);
    background: #10b981;
  }
  50% {
    transform: scale(1.05);
    background: #059669;
  }
  100% {
    transform: scale(1);
    background: #10b981;
  }
}

.save-button.success {
  animation: save-success 600ms ease-out;
}
```

### Theme Change Animation

```css
@keyframes theme-transition {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

body.theme-changing {
  animation: theme-transition 300ms ease-in-out;
}
```

---

## Cross-References

### Related Screens
- 【參考：02-screens/management/character-status.md】 - Display preferences apply
- 【參考：02-screens/management/skill-management.md】 - Hotkey configuration
- 【參考：02-screens/shops/bank.md】 - Cost management related

### Screen Transitions
【參考：03-flows/screen-transitions.md】
- From Anywhere: Press `Esc` → Settings menu
- Close: Press `Esc` again → Return to previous screen
- Auto-save check: Prompts before close if unsaved

### Design System
【參考：01-design-system/colors.md】 - Theme colors
【參考：01-design-system/typography.md】 - Font size options
【參考：01-design-system/animation-timing.md】 - Animation speeds

---

## Implementation Notes

### Settings Data Structure

```typescript
interface Settings {
  // General
  language: Language;
  theme: Theme;
  autoSave: boolean;
  autoSaveInterval: number; // minutes
  rpgLevel: number; // 0-100
  notifications: NotificationSettings;

  // Audio
  masterVolume: number; // 0-100
  bgmEnabled: boolean;
  bgmVolume: number;
  bgmTrack: string;
  sfxEnabled: boolean;
  sfxVolume: number;
  sfxCategories: {
    ui: number;
    battle: number;
    skill: number;
    notification: number;
  };
  voiceEnabled: boolean;
  voiceCharacter: string;
  voiceSpeed: number;
  muteAll: boolean;
  focusMode: boolean;

  // Display
  animationEnabled: boolean;
  animationSpeed: number;
  reducedMotion: boolean;
  typewriterSpeed: number; // ms per char
  fontSize: FontSize;
  lineHeight: number;
  particleEffects: boolean;
  glowEffects: boolean;
  screenShake: boolean;
  floatingNumbers: boolean;
  effectQuality: EffectQuality;
  colorBlindMode: ColorBlindMode;
  contrast: number;
  saturation: number;

  // Accessibility
  highContrast: boolean;
  largeButtons: boolean;
  removeFlashing: boolean;
  showAllLabels: boolean;

  // Keyboard Shortcuts
  shortcuts: Record<string, string>;

  // AI Model
  defaultModel: AIModel;
  dailyBudget: number;
  monthlyBudget: number;
  budgetExceededAction: BudgetAction;
  smartRouting: boolean;
  apiKeys: {
    anthropic?: string;
    google?: string;
    openai?: string;
  };

  // Permissions
  permissionPreset: PermissionPreset;
  permissions: {
    fileSystem: FileSystemPermissions;
    commandExecution: CommandPermissions;
    networkAccess: NetworkPermissions;
    databaseAccess: DatabasePermissions;
    notifications: NotificationPermissions;
  };
  confirmDangerousOperations: boolean;
  confirmSensitiveFiles: boolean;
  confirmNetworkRequests: boolean;
  logAllOperations: boolean;
  logRetentionDays: number;
}
```

### Settings Manager

```typescript
class SettingsManager {
  private settings: Settings;
  private defaultSettings: Settings;
  private unsavedChanges: boolean = false;

  constructor() {
    this.defaultSettings = this.getDefaultSettings();
    this.settings = this.loadSettings();
  }

  loadSettings(): Settings {
    const saved = localStorage.getItem('rpg-cli-settings');
    if (saved) {
      return { ...this.defaultSettings, ...JSON.parse(saved) };
    }
    return this.defaultSettings;
  }

  saveSettings(): boolean {
    try {
      localStorage.setItem('rpg-cli-settings', JSON.stringify(this.settings));
      this.unsavedChanges = false;
      this.notifySettingsSaved();
      return true;
    } catch (error) {
      this.notifyError('Failed to save settings');
      return false;
    }
  }

  updateSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.settings[key] = value;
    this.unsavedChanges = true;
    this.notifySettingChanged(key);
  }

  resetToDefaults(): void {
    this.settings = { ...this.defaultSettings };
    this.unsavedChanges = true;
    this.notifySettingsReset();
  }

  resetTab(tab: SettingsTab): void {
    const tabKeys = this.getTabKeys(tab);
    tabKeys.forEach(key => {
      this.settings[key] = this.defaultSettings[key];
    });
    this.unsavedChanges = true;
  }

  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  importSettings(json: string): boolean {
    try {
      const imported = JSON.parse(json);
      this.settings = { ...this.defaultSettings, ...imported };
      this.saveSettings();
      return true;
    } catch (error) {
      this.notifyError('Invalid settings file');
      return false;
    }
  }

  hasUnsavedChanges(): boolean {
    return this.unsavedChanges;
  }

  applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }

  applyAccessibilitySettings(): void {
    if (this.settings.highContrast) {
      document.body.classList.add('high-contrast');
    }
    if (this.settings.reducedMotion) {
      document.body.classList.add('reduced-motion');
    }
    if (this.settings.largeButtons) {
      document.body.classList.add('large-buttons');
    }
  }
}
```

### Validation

```typescript
class SettingsValidator {
  validate(settings: Partial<Settings>): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate ranges
    if (settings.masterVolume !== undefined) {
      if (settings.masterVolume < 0 || settings.masterVolume > 100) {
        errors.push({
          field: 'masterVolume',
          message: 'Volume must be between 0 and 100'
        });
      }
    }

    // Validate API keys format
    if (settings.apiKeys?.anthropic) {
      if (!this.isValidAPIKey(settings.apiKeys.anthropic, 'anthropic')) {
        errors.push({
          field: 'apiKeys.anthropic',
          message: 'Invalid Anthropic API key format'
        });
      }
    }

    // Validate budget
    if (settings.dailyBudget !== undefined) {
      if (settings.dailyBudget <= 0) {
        errors.push({
          field: 'dailyBudget',
          message: 'Budget must be greater than 0'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private isValidAPIKey(key: string, provider: string): boolean {
    const patterns = {
      anthropic: /^sk-ant-[a-zA-Z0-9-_]{95,}$/,
      google: /^AIza[a-zA-Z0-9-_]{35}$/,
      openai: /^sk-[a-zA-Z0-9]{48}$/
    };

    return patterns[provider]?.test(key) ?? false;
  }
}
```

---

## Accessibility

### Screen Reader Support

```html
<section aria-label="Settings" role="dialog">
  <h1 id="settings-title">Settings</h1>

  <nav aria-label="Settings tabs" role="tablist">
    <button role="tab" aria-selected="true" aria-controls="general-panel">
      General
    </button>
    <button role="tab" aria-selected="false" aria-controls="audio-panel">
      Audio
    </button>
  </nav>

  <div id="general-panel" role="tabpanel" aria-labelledby="general-tab">
    <h2>General Settings</h2>

    <div role="group" aria-labelledby="language-label">
      <label id="language-label">Language</label>
      <select aria-label="Select language">
        <option>Traditional Chinese</option>
        <option>English</option>
      </select>
    </div>

    <div role="group" aria-labelledby="volume-label">
      <label id="volume-label">Master Volume</label>
      <input
        type="range"
        min="0"
        max="100"
        value="75"
        aria-label="Master volume, 75 percent"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="75"
        aria-valuetext="75 percent"
      />
    </div>
  </div>
</section>
```

### Keyboard Navigation

**Focus Order:**
1. Close button
2. Tab bar
3. Settings within active tab (top to bottom)
4. Action buttons (Save, Reset)

**Keyboard Shortcuts:**
```
Esc       - Close (with unsaved warning)
S         - Save
R         - Reset current tab
←/→       - Switch tabs
Tab       - Next field
Enter     - Confirm/Apply
Space     - Toggle checkbox
```

### High Contrast Support

```css
@media (prefers-contrast: high) {
  .settings-screen {
    border: 3px solid #fff;
  }

  .tab-button {
    border: 2px solid #fff;
  }

  .tab-button[aria-selected="true"] {
    background: #000;
    color: #fff;
    border-width: 3px;
  }

  input[type="range"]::-webkit-slider-thumb {
    border: 3px solid #fff;
  }
}
```

---

## Responsive Design

### Desktop (≥1200px)

```
┌───────────────────────────────────────┐
│  [Tabs (horizontal)]                  │
│  ──────────────────────────────────   │
│  [Settings Content]                   │
│  - Two column layout for some sections│
│  - Full width sliders                 │
│  - Inline action buttons              │
└───────────────────────────────────────┘
```

### Tablet (768px - 1199px)

```
┌──────────────────────────────┐
│  [Tabs (horizontal)]         │
│  ────────────────────────    │
│  [Settings Content]          │
│  - Single column             │
│  - Full width controls       │
└──────────────────────────────┘
```

### Mobile (<768px)

```
┌────────────────┐
│ [Tab Dropdown] │
│ ───────────    │
│ [Settings]     │
│ - Vertical     │
│ - Large touch  │
│ - Stack labels │
│  (scroll)      │
│ ───────────    │
│ [Save] [Reset] │
└────────────────┘
```

---

## Version History

- **v1.0** (2026-02-05): Initial settings screen design
  - General, Audio, Display, Shortcuts, AI Model, Permissions tabs
  - Theme switcher
  - RPG level slider
  - AI model configuration
  - Permission management
  - Accessibility options
  - Responsive layouts
  - Import/Export settings
