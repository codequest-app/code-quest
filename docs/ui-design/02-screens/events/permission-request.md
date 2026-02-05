# Permission Request Screen - 權限請求畫面

**分類**: Event & Modal Screens
**類型**: Permission & Security Modal
**優先級**: Critical
**最後更新**: 2026-02-05

---

## 概述

權限請求畫面是當 AI 需要使用新的工具或執行高風險操作時出現的安全確認介面。在 RPG 化設計中，權限請求被轉化為「力量借用請求」，AI 魔法師需要借用使用者的力量來施展更強大的魔法。

### 請求場景

- **新工具使用**: Skill 請求使用尚未授權的工具
- **檔案系統操作**: 刪除、重命名、移動檔案
- **系統命令執行**: 執行 shell 命令
- **網路請求**: 訪問外部 API
- **敏感資料讀取**: 讀取環境變數、密鑰檔案
- **權限提升**: 需要管理員權限的操作

---

## ASCII 佈局設計

### 一般權限請求

```
┌────────────────────────────────────────────────────────────────────────┐
│                      【戰鬥畫面 - 50% 不透明度】                         │
│                                                                        │
│    ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    │
│    ┃  🔐 力量借用請求                          [ESC] 取消 ┃    │
│    ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫    │
│    ┃                                                              ┃    │
│    ┃  ✨ 魔法師需要借用額外的力量來施展強大的魔法！               ┃    │
│    ┃                                                              ┃    │
│    ┃  ╔═══════════════════════════════════════════════════════╗  ┃    │
│    ┃  ║  🔓 請求的力量                                        ║  ┃    │
│    ┃  ╠═══════════════════════════════════════════════════════╣  ┃    │
│    ┃  ║                                                       ║  ┃    │
│    ┃  ║  工具名稱: Bash                                      ║  ┃    │
│    ┃  ║  請求時間: 2026-02-05 15:32:45                       ║  ┃    │
│    ┃  ║                                                       ║  ┃    │
│    ┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃    │
│    ┃  ║  │ 🔨 需要的能力:                                │ ║  ┃    │
│    ┃  ║  │ ────────────────────────────────────────────  │ ║  ┃    │
│    ┃  ║  │ • 執行 Shell 命令                             │ ║  ┃    │
│    ┃  ║  │ • 讀取系統輸出                                │ ║  ┃    │
│    ┃  ║  │ • 修改檔案權限                                │ ║  ┃    │
│    ┃  ║  └────────────────────────────────────────────────┘ ║  ┃    │
│    ┃  ║                                                       ║  ┃    │
│    ┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃    │
│    ┃  ║  │ 📝 原因說明:                                  │ ║  ┃    │
│    ┃  ║  │ ────────────────────────────────────────────  │ ║  ┃    │
│    ┃  ║  │ 需要執行 npm install 來安裝專案依賴           │ ║  ┃    │
│    ┃  ║  │                                                │ ║  ┃    │
│    ┃  ║  │ 命令: npm install                             │ ║  ┃    │
│    ┃  ║  │ 目錄: /Users/dev/project                      │ ║  ┃    │
│    ┃  ║  └────────────────────────────────────────────────┘ ║  ┃    │
│    ┃  ║                                                       ║  ┃    │
│    ┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃    │
│    ┃  ║  │ ⚠️ 風險評估:  🟡 中等                        │ ║  ┃    │
│    ┃  ║  │ ────────────────────────────────────────────  │ ║  ┃    │
│    ┃  ║  │ • 執行外部命令可能有安全風險                   │ ║  ┃    │
│    ┃  ║  │ • 建議檢查命令內容                            │ ║  ┃    │
│    ┃  ║  │ • 此操作可能修改專案結構                      │ ║  ┃    │
│    ┃  ║  └────────────────────────────────────────────────┘ ║  ┃    │
│    ┃  ║                                                       ║  ┃    │
│    ┃  ║  ℹ️ 此操作需要你的明確授權                           ║  ┃    │
│    ┃  ║                                                       ║  ┃    │
│    ┃  ╚═══════════════════════════════════════════════════════╝  ┃    │
│    ┃                                                              ┃    │
│    ┃  ┌────────────────────┐  ┌────────────────────┐            ┃    │
│    ┃  │ [✅] 授予力量       │  │ [📋] 查看詳情       │            ┃    │
│    ┃  │    僅本次          │  │                    │            ┃    │
│    ┃  └────────────────────┘  └────────────────────┘            ┃    │
│    ┃                                                              ┃    │
│    ┃  ┌────────────────────┐  ┌────────────────────┐            ┃    │
│    ┃  │ [⭐] 永久授予       │  │ [❌] 拒絕請求       │            ┃    │
│    ┃  │    加入預設集       │  │                    │            ┃    │
│    ┃  └────────────────────┘  └────────────────────┘            ┃    │
│    ┃                                                              ┃    │
│    ┃  ┌────────────────────────────────────────────────────┐    ┃    │
│    ┃  │ [ ] 記住此決定 (不再詢問此工具)                    │    ┃    │
│    ┃  └────────────────────────────────────────────────────┘    ┃    │
│    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 高風險權限請求

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🚨 高風險力量請求！                      [ESC] 取消 ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                              ┃
┃  ⚡ 警告！此魔法威力強大，可能造成無法挽回的後果！            ┃
┃                                                              ┃
┃  ╔═══════════════════════════════════════════════════════╗  ┃
┃  ║  🔴 高風險操作                                        ║  ┃
┃  ╠═══════════════════════════════════════════════════════╣  ┃
┃  ║                                                       ║  ┃
┃  ║  工具名稱: Bash (系統命令)                           ║  ┃
┃  ║  風險等級: 🔴🔴🔴 極高                               ║  ┃
┃  ║                                                       ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ ⚠️ 請求的危險能力:                            │ ║  ┃
┃  ║  │ ────────────────────────────────────────────  │ ║  ┃
┃  ║  │ 🗑️ 刪除檔案或目錄                            │ ║  ┃
┃  ║  │ 📝 修改系統配置                               │ ║  ┃
┃  ║  │ 🔓 變更檔案權限                               │ ║  ┃
┃  ║  │ ⚡ 執行 sudo 命令                             │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ 🎯 執行命令:                                  │ ║  ┃
┃  ║  │ ────────────────────────────────────────────  │ ║  ┃
┃  ║  │ rm -rf node_modules                           │ ║  ┃
┃  ║  │                                                │ ║  ┃
┃  ║  │ 📁 目標路徑:                                  │ ║  ┃
┃  ║  │ /Users/dev/project/node_modules               │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ 🚨 風險警告:                                  │ ║  ┃
┃  ║  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ ║  ┃
┃  ║  │ ⚠️ 此操作將永久刪除約 250 MB 的檔案         │ ║  ┃
┃  ║  │ ⚠️ 刪除後無法復原                            │ ║  ┃
┃  ║  │ ⚠️ 可能影響專案正常運作                      │ ║  ┃
┃  ║  │ ⚠️ 建議先備份重要檔案                        │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ 📝 原因說明:                                  │ ║  ┃
┃  ║  │ 清理舊的依賴項以解決版本衝突                  │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ╚═══════════════════════════════════════════════════════╝  ┃
┃                                                              ┃
┃  ⚠️ 請仔細閱讀以上資訊後再做決定                            ┃
┃                                                              ┃
┃  ┌────────────────────┐  ┌────────────────────┐            ┃
┃  │ [✅] 我了解風險     │  │ [📋] 查看影響範圍   │            ┃
┃  │    授予權限        │  │                    │            ┃
┃  └────────────────────┘  └────────────────────┘            ┃
┃                                                              ┃
┃  ┌────────────────────┐  ┌────────────────────┐            ┃
┃  │ [❌] 拒絕請求       │  │ [🔄] 建議替代方案   │            ┃
┃  └────────────────────┘  └────────────────────┘            ┃
┃                                                              ┃
┃  ⚠️ 不建議「永久授予」此類高風險操作                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### 權限歷史記錄

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📜 權限使用歷史                          [ESC] 關閉 ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                              ┃
┃  ╔═══════════════════════════════════════════════════════╗  ┃
┃  ║  📊 統計資訊                                          ║  ┃
┃  ╠═══════════════════════════════════════════════════════╣  ┃
┃  ║                                                       ║  ┃
┃  ║  本次戰鬥已使用權限: 12 次                           ║  ┃
┃  ║  本日總計: 45 次                                     ║  ┃
┃  ║  永久授權工具: 5 個                                  ║  ┃
┃  ║                                                       ║  ┃
┃  ╚═══════════════════════════════════════════════════════╝  ┃
┃                                                              ┃
┃  ╔═══════════════════════════════════════════════════════╗  ┃
┃  ║  📋 最近 5 次權限請求                                 ║  ┃
┃  ╠═══════════════════════════════════════════════════════╣  ┃
┃  ║                                                       ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ 1. Bash - npm install                         │ ║  ┃
┃  ║  │    時間: 15:32:45                              │ ║  ┃
┃  ║  │    狀態: ✅ 已授予 (僅一次)                   │ ║  ┃
┃  ║  │    風險: 🟡 中等                              │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ 2. Write - 修改 config.json                   │ ║  ┃
┃  ║  │    時間: 15:28:12                              │ ║  ┃
┃  ║  │    狀態: ✅ 已授予 (永久)                     │ ║  ┃
┃  ║  │    風險: 🟢 低                                │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ 3. Bash - rm -rf dist/                        │ ║  ┃
┃  ║  │    時間: 15:15:33                              │ ║  ┃
┃  ║  │    狀態: ❌ 已拒絕                            │ ║  ┃
┃  ║  │    風險: 🔴 高                                │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ 4. Read - 讀取 .env                           │ ║  ┃
┃  ║  │    時間: 15:10:21                              │ ║  ┃
┃  ║  │    狀態: ✅ 已授予 (僅一次)                   │ ║  ┃
┃  ║  │    風險: 🟡 中等                              │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ 5. Glob - 搜尋 *.config.js                    │ ║  ┃
┃  ║  │    時間: 15:05:18                              │ ║  ┃
┃  ║  │    狀態: ✅ 已授予 (永久)                     │ ║  ┃
┃  ║  │    風險: 🟢 低                                │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ╚═══════════════════════════════════════════════════════╝  ┃
┃                                                              ┃
┃  ┌────────────────────┐  ┌────────────────────┐            ┃
┃  │ [🔧] 管理永久權限   │  │ [🗑️] 清除歷史       │            ┃
┃  └────────────────────┘  └────────────────────┘            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### 權限預設集管理

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ⚙️ 權限預設集管理                        [ESC] 關閉 ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                              ┃
┃  💡 預設集可以自動授予特定工具的權限，無需每次確認          ┃
┃                                                              ┃
┃  ╔═══════════════════════════════════════════════════════╗  ┃
┃  ║  📦 當前預設集                                        ║  ┃
┃  ╠═══════════════════════════════════════════════════════╣  ┃
┃  ║                                                       ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ ☑ Read (讀取工具)                             │ ║  ┃
┃  ║  │   所有檔案讀取操作                             │ ║  ┃
┃  ║  │   風險: 🟢 低                                 │ ║  ┃
┃  ║  │   [🗑️ 移除]                                   │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ ☑ Write (寫入工具)                            │ ║  ┃
┃  ║  │   非系統檔案的寫入操作                         │ ║  ┃
┃  ║  │   風險: 🟡 中等                               │ ║  ┃
┃  ║  │   [🗑️ 移除]                                   │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ ☑ Glob (搜尋工具)                             │ ║  ┃
┃  ║  │   檔案模式搜尋                                 │ ║  ┃
┃  ║  │   風險: 🟢 低                                 │ ║  ┃
┃  ║  │   [🗑️ 移除]                                   │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ ☑ Grep (內容搜尋)                             │ ║  ┃
┃  ║  │   檔案內容搜尋                                 │ ║  ┃
┃  ║  │   風險: 🟢 低                                 │ ║  ┃
┃  ║  │   [🗑️ 移除]                                   │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ ☑ Edit (檔案編輯)                             │ ║  ┃
┃  ║  │   檔案部分修改                                 │ ║  ┃
┃  ║  │   風險: 🟡 中等                               │ ║  ┃
┃  ║  │   [🗑️ 移除]                                   │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ╚═══════════════════════════════════════════════════════╝  ┃
┃                                                              ┃
┃  ╔═══════════════════════════════════════════════════════╗  ┃
┃  ║  ➕ 可加入的工具                                      ║  ┃
┃  ╠═══════════════════════════════════════════════════════╣  ┃
┃  ║                                                       ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ ☐ Bash (Shell 命令)                           │ ║  ┃
┃  ║  │   執行系統命令                                 │ ║  ┃
┃  ║  │   風險: 🔴 高                                 │ ║  ┃
┃  ║  │   [➕ 加入]                                   │ ║  ┃
┃  ║  │   ⚠️ 不建議加入預設集                        │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ╚═══════════════════════════════════════════════════════╝  ┃
┃                                                              ┃
┃  ┌────────────────────┐  ┌────────────────────┐            ┃
┃  │ [💾] 保存變更       │  │ [🔙] 返回           │            ┃
┃  └────────────────────┘  └────────────────────┘            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 組件規格

### Permission Modal

【參考：04-components/modal.md】

**屬性**:
- 背景遮罩: 50% 不透明黑色
- 焦點陷阱: 啟用
- ESC 關閉: 啟用（視為拒絕）
- 點擊外部關閉: 禁用（高風險操作）
- Z-index: 2500（高於一般 modal）

### Permission Request Data

```typescript
enum PermissionRiskLevel {
  Low = 'low',          // 綠色，安全操作
  Medium = 'medium',    // 黃色，需要注意
  High = 'high',        // 橙色，有風險
  Critical = 'critical' // 紅色，極高風險
}

interface PermissionRequest {
  id: string;
  toolName: string;             // 工具名稱
  capabilities: string[];       // 需要的能力列表
  reason: string;               // 請求原因
  riskLevel: PermissionRiskLevel;
  command?: string;             // 執行的命令（如果適用）
  targetPath?: string;          // 目標路徑
  estimatedImpact?: string;     // 預估影響
  warnings?: string[];          // 警告訊息
  alternatives?: string[];      // 替代方案
  timestamp: Date;
}

interface PermissionResponse {
  granted: boolean;
  scope: 'once' | 'always';     // 僅一次或永久
  remember: boolean;            // 記住決定
  timestamp: Date;
}
```

### Risk Level Indicators

```css
/* 風險等級顏色與圖標 */
.risk-low {
  color: #4CAF50;
  border-color: #4CAF50;
}
.risk-low::before {
  content: '🟢';
}

.risk-medium {
  color: #FFC107;
  border-color: #FFC107;
}
.risk-medium::before {
  content: '🟡';
}

.risk-high {
  color: #FF9800;
  border-color: #FF9800;
}
.risk-high::before {
  content: '🟠';
}

.risk-critical {
  color: #F44336;
  border-color: #F44336;
  animation: pulse-red 1s infinite;
}
.risk-critical::before {
  content: '🔴';
}
```

### Permission Preset

```typescript
interface PermissionPreset {
  name: string;
  tools: string[];              // 包含的工具列表
  autoGrant: boolean;           // 是否自動授予
  conditions?: {                // 條件限制
    maxFileSize?: number;
    allowedPaths?: string[];
    deniedPaths?: string[];
    allowedCommands?: RegExp[];
  };
}

// 預設的安全預設集
const SAFE_PRESET: PermissionPreset = {
  name: 'safe',
  tools: ['Read', 'Glob', 'Grep'],
  autoGrant: true,
  conditions: {
    deniedPaths: ['.env', '.git', 'node_modules/.bin']
  }
};
```

---

## 狀態管理

### Permission State

```typescript
interface PermissionState {
  isActive: boolean;
  request: PermissionRequest | null;
  history: PermissionResponse[];
  presets: PermissionPreset[];
  showHistory: boolean;
  showPresetManager: boolean;
}
```

### Permission Storage

```typescript
// 儲存到 localStorage
interface PermissionStorage {
  presets: PermissionPreset[];
  rememberedDecisions: {
    [toolName: string]: {
      granted: boolean;
      conditions: any;
      timestamp: Date;
    };
  };
  statistics: {
    totalRequests: number;
    grantedCount: number;
    deniedCount: number;
  };
}
```

### Auto-grant Logic

```typescript
function shouldAutoGrant(request: PermissionRequest): boolean {
  // 檢查是否在預設集中
  const preset = getActivePreset();
  if (!preset.tools.includes(request.toolName)) {
    return false;
  }

  // 檢查條件限制
  if (preset.conditions) {
    const { allowedPaths, deniedPaths, allowedCommands } = preset.conditions;

    // 檢查路徑限制
    if (request.targetPath) {
      if (deniedPaths?.some(path => request.targetPath!.includes(path))) {
        return false;
      }
      if (allowedPaths && !allowedPaths.some(path => request.targetPath!.includes(path))) {
        return false;
      }
    }

    // 檢查命令限制
    if (request.command && allowedCommands) {
      if (!allowedCommands.some(regex => regex.test(request.command!))) {
        return false;
      }
    }
  }

  return preset.autoGrant;
}
```

---

## 互動設計

### 鍵盤操作

| 按鍵 | 功能 |
|------|------|
| `Y` | 授予權限（僅一次） |
| `A` | 永久授予（加入預設集） |
| `N` | 拒絕請求 |
| `D` | 查看詳情 |
| `H` | 查看歷史記錄 |
| `Enter` | 確認當前選擇 |
| `Esc` | 拒絕並關閉 |
| `Tab` | 在按鈕間切換焦點 |
| `Space` | 切換「記住決定」選項 |

### 滑鼠操作

- **點擊「授予力量（僅本次）」**: 授予一次性權限
- **點擊「永久授予」**: 加入預設集，自動授予
- **點擊「拒絕請求」**: 拒絕權限並關閉
- **點擊「查看詳情」**: 展開完整資訊
- **點擊「查看影響範圍」**: 顯示操作影響分析
- **點擊「建議替代方案」**: 顯示更安全的替代方案
- **勾選「記住此決定」**: 不再詢問此工具

### 觸控手勢

- **點擊按鈕**: 執行對應操作
- **長按警告區域**: 顯示詳細風險說明
- **向下滑動**: 關閉 modal（視為拒絕）

---

## 動畫效果

### 入場動畫

【參考：01-design-system/animation-timing.md】

```
0.0s  ├─ 背景遮罩淡入 (300ms)
0.1s  ├─ Modal 縮放進入 (400ms, spring)
0.2s  ├─ 權限圖標發光 (300ms)
0.3s  ├─ 請求詳情淡入 (200ms)
0.4s  ├─ 風險警告脈衝 (如果是高風險)
0.6s  └─ 按鈕滑入 (200ms, stagger 50ms)
```

### 高風險警告動畫

```css
/* 高風險邊框脈衝 */
@keyframes pulse-border {
  0%, 100% {
    border-color: #F44336;
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7);
  }
  50% {
    border-color: #D32F2F;
    box-shadow: 0 0 0 10px rgba(244, 67, 54, 0);
  }
}

.high-risk-modal {
  animation: pulse-border 2s infinite;
}
```

### 授予權限動畫

```typescript
// 授予權限時的視覺回饋
const grantAnimation = {
  icon: {
    scale: [1, 1.5, 1],
    rotate: [0, 360],
    filter: ['brightness(1)', 'brightness(2)', 'brightness(1)']
  },
  modal: {
    opacity: [1, 0],
    scale: [1, 0.9]
  }
}
```

### 拒絕權限動畫

```typescript
// 拒絕權限時的震動效果
const denyAnimation = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.5 }
  },
  fade: {
    opacity: [1, 0],
    transition: { duration: 0.3, delay: 0.5 }
  }
}
```

---

## 戰鬥畫面整合

### 權限請求觸發時

```
戰鬥畫面:
- 暫停戰鬥動畫
- 魔法師進入「請求」姿態（雙手合十）
- 玩家角色周圍出現金色光環
- 顯示「🔐 請求力量...」狀態
- 背景音樂切換為神聖音樂
```

### 授予權限後

```
戰鬥畫面:
- 金色光芒從玩家傳遞到魔法師
- 魔法師獲得「力量加成」buff
- 顯示「✨ 力量已授予！」動畫
- 戰鬥日誌更新：「授予魔法師 [工具名稱] 的力量！」
- 魔法師可以使用新工具
- 恢復戰鬥動畫
```

### 拒絕權限後

```
戰鬥畫面:
- 光環消散動畫
- 魔法師顯示「失望」表情
- 戰鬥日誌更新：「拒絕了力量借用請求」
- 魔法師尋找替代方案
- 可能觸發「建議替代方案」對話
```

### 高風險操作

```
戰鬥畫面:
- 螢幕邊緣閃爍紅光
- 播放警告音效
- 玩家角色周圍出現警告標誌
- 戰鬥日誌顯示：「⚠️ 警告：高風險魔法！」
```

---

## 無障礙設計

### 螢幕閱讀器

```html
<div role="dialog"
     aria-labelledby="permission-title"
     aria-describedby="permission-description"
     aria-modal="true">

  <h2 id="permission-title">
    <span aria-label="權限請求">🔐</span>
    力量借用請求
  </h2>

  <div id="permission-description">
    <p>魔法師需要借用額外的力量來施展強大的魔法</p>

    <section aria-label="請求詳情">
      <h3>工具名稱：Bash</h3>

      <div aria-label="需要的能力">
        <h4>需要的能力：</h4>
        <ul>
          <li>執行 Shell 命令</li>
          <li>讀取系統輸出</li>
          <li>修改檔案權限</li>
        </ul>
      </div>

      <div aria-label="風險評估">
        <p>
          <span aria-label="風險等級：中等">⚠️</span>
          風險等級：中等
        </p>
        <ul aria-label="風險警告">
          <li>執行外部命令可能有安全風險</li>
          <li>建議檢查命令內容</li>
        </ul>
      </div>
    </section>
  </div>

  <nav aria-label="權限操作">
    <button aria-label="授予權限，僅限本次使用">
      授予力量（僅本次）
    </button>
    <button aria-label="永久授予權限，加入預設集">
      永久授予（加入預設集）
    </button>
    <button aria-label="拒絕權限請求">
      拒絕請求
    </button>
    <button aria-label="查看詳細資訊">
      查看詳情
    </button>
  </nav>

  <label>
    <input type="checkbox" aria-label="記住此決定，不再詢問此工具" />
    記住此決定（不再詢問此工具）
  </label>
</div>
```

### 風險等級視覺化

確保不僅依賴顏色，還使用：
- 圖標：🟢 🟡 🟠 🔴
- 文字標籤：低、中等、高、極高
- 邊框粗細：風險越高邊框越粗
- 動畫：高風險使用脈衝動畫

---

## 響應式設計

### 桌面版 (≥ 1024px)

```
Modal 寬度: 700px
按鈕: 2x2 網格
字體大小: 16px
風險警告: 完整顯示
```

### 平板版 (768px - 1023px)

```
Modal 寬度: 85vw
按鈕: 2x2 網格或縱向排列
字體大小: 17px
風險警告: 簡化顯示
```

### 手機版 (< 768px)

```
Modal 寬度: 95vw
Modal 高度: 最大 85vh
按鈕: 全寬縱向排列
字體大小: 18px
風險警告: 摺疊顯示，可展開
能力列表: 簡化為數量（3 項能力）
```

---

## 實作注意事項

### 權限快取

```typescript
// 快取已授權的權限（會話期間）
class PermissionCache {
  private cache = new Map<string, PermissionResponse>();

  set(key: string, response: PermissionResponse) {
    this.cache.set(key, response);
  }

  get(key: string): PermissionResponse | undefined {
    const cached = this.cache.get(key);

    // 檢查是否過期（永久授權不過期）
    if (cached && cached.scope === 'once') {
      // 一次性權限只在當前會話有效
      return cached;
    }

    return cached;
  }

  clear() {
    // 清除所有一次性權限，保留永久權限
    for (const [key, value] of this.cache.entries()) {
      if (value.scope === 'once') {
        this.cache.delete(key);
      }
    }
  }
}
```

### 安全性檢查

```typescript
// 危險命令檢測
const DANGEROUS_COMMANDS = [
  /rm\s+-rf\s+\//,          // 刪除根目錄
  /sudo\s+rm/,              // sudo 刪除
  /format\s+[c-z]:/i,       // 格式化磁碟
  /dd\s+if=.*of=\/dev\//,   // dd 寫入裝置
  />\s*\/dev\/sda/,         // 重定向到裝置
];

function isDangerousCommand(command: string): boolean {
  return DANGEROUS_COMMANDS.some(regex => regex.test(command));
}

function assessRiskLevel(request: PermissionRequest): PermissionRiskLevel {
  // 檢查工具類型
  if (request.toolName === 'Bash') {
    if (request.command && isDangerousCommand(request.command)) {
      return PermissionRiskLevel.Critical;
    }
    return PermissionRiskLevel.High;
  }

  // 檢查目標路徑
  if (request.targetPath) {
    const sensitivePatterns = ['.env', '.ssh', '.git', 'node_modules/.bin'];
    if (sensitivePatterns.some(p => request.targetPath!.includes(p))) {
      return PermissionRiskLevel.High;
    }
  }

  // 預設為中等風險
  return PermissionRiskLevel.Medium;
}
```

### 權限審計日誌

```typescript
interface PermissionAuditLog {
  timestamp: Date;
  request: PermissionRequest;
  response: PermissionResponse;
  userAgent: string;
  sessionId: string;
}

function logPermissionAudit(
  request: PermissionRequest,
  response: PermissionResponse
) {
  const log: PermissionAuditLog = {
    timestamp: new Date(),
    request,
    response,
    userAgent: navigator.userAgent,
    sessionId: getCurrentSessionId()
  };

  // 寫入審計日誌
  writeAuditLog(log);

  // 高風險操作額外記錄
  if (request.riskLevel === PermissionRiskLevel.Critical) {
    notifySecurityTeam(log);
  }
}
```

### 替代方案建議

```typescript
function suggestAlternatives(request: PermissionRequest): string[] {
  const alternatives: string[] = [];

  // 針對不同的請求提供替代方案
  if (request.toolName === 'Bash' && request.command?.includes('rm -rf')) {
    alternatives.push(
      '使用安全的檔案刪除工具',
      '移動到垃圾桶而非直接刪除',
      '先備份後再刪除'
    );
  }

  if (request.toolName === 'Write' && request.targetPath?.includes('.env')) {
    alternatives.push(
      '使用環境變數管理工具',
      '編輯 .env.example 而非 .env',
      '詢問使用者手動修改'
    );
  }

  return alternatives;
}
```

---

## 相關畫面連結

- **Error Handling**: `02-screens/events/error-handling.md`
- **User Question**: `02-screens/events/user-question.md`
- **Settings - Security**: `02-screens/management/settings.md`
- **Modal Component**: `04-components/modal.md`
- **Animation Timing**: `01-design-system/animation-timing.md`

---

## 設計決策記錄

### 為什麼需要權限系統？

權限系統是安全性的關鍵，防止 AI 在未經授權的情況下執行高風險操作，給予使用者完全的控制權。

### 為什麼區分「僅一次」和「永久授予」？

提供靈活性：對於信任的操作可以永久授予以提升效率，對於風險操作則每次都需確認。

### 為什麼高風險操作不建議加入預設集？

高風險操作（如刪除檔案、執行 sudo）應該每次都需要明確確認，避免自動授權造成意外損失。

### 為什麼顯示權限歷史記錄？

透明度很重要，讓使用者可以審查 AI 使用了哪些權限，增加信任感並方便安全審計。

---

**最後更新**: 2026-02-05
**作者**: UI Design Team
**版本**: 1.0
