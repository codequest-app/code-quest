# Orchestrator UI Redesign — Implementation

## 技術選型

| 技術 | 選擇 | 理由 |
|------|------|------|
| Panel 分割 | `react-resizable-panels` | 輕量、支援拖拽、IDE 級佈局、a11y 內建 |
| UI 元件 | `shadcn/ui` + Tailwind CSS v4 | AI-native、copy-paste 不綁定、dark theme 內建 |
| Markdown 渲染 | `react-markdown`（現有） | 已整合、搭配 remark-gfm |
| 狀態管理 | Zustand（現有） | 按 feature 拆 store |
| 串流輸出 | `<pre>` + auto-scroll | 簡單、效能好、避免 xterm.js overhead |
| 表單驗證 | `react-hook-form` + `zod`（現有） | 已整合在 DispatchForm |

---

## 元件架構

```
<OrchestratorPage orchestratorId={id}>
│
├── <PhaseHeader status={status} workers={workers} onAbort={abort} />
│
├── status === 'idle'
│   └── <TaskPlanner onDispatch={dispatch} />
│       ├── <TaskRow>[]                    (react-hook-form field array)
│       └── <DispatchButton count={n} />
│
├── status === 'dispatching'
│   └── <DispatchingOverlay count={n} />
│
├── status === 'workers-running' | 'workers-complete'
│   └── <WorkerGrid workers={workers} onSynthesize={synthesize} />
│       ├── <ResizablePanelGroup>          (react-resizable-panels)
│       │   └── <WorkerPane worker={w}>[]
│       │       ├── <WorkerPaneHeader />
│       │       └── <StreamOutput text={w.result} />
│       └── <WorkerGridFooter>
│           ├── <AggregatedStats />
│           └── <SynthesizeButton />       (only workers-complete)
│
├── status === 'synthesizing' | 'complete'
│   └── <SynthesisView>
│       ├── <ResizablePanelGroup direction="horizontal">
│       │   ├── <CoordinatorPanel>         (70% width)
│       │   │   └── <MarkdownStream />     (react-markdown)
│       │   └── <WorkerSummaryPanel>       (30% width)
│       │       └── <WorkerSummaryCard>[]
│       └── <SynthesisFooter stats={aggregatedStats} />
│
└── status === 'error'
    └── <ErrorView error={error} workers={workers} onRetry={retry} />
```

---

## 新增檔案列表

```
packages/client/src/
├── components/
│   └── OrchestratorPanel/           ← 重寫此目錄
│       ├── OrchestratorPage.tsx      ← 主容器，Phase 路由
│       ├── PhaseHeader.tsx           ← 頂部狀態 + 進度條
│       ├── TaskPlanner.tsx           ← Phase: idle 表單
│       ├── DispatchingOverlay.tsx    ← Phase: dispatching 過渡
│       ├── WorkerGrid.tsx           ← Phase: workers-* 面板容器
│       ├── WorkerPane.tsx           ← 單一 Worker 面板
│       ├── WorkerPaneHeader.tsx     ← Worker 面板標題列
│       ├── StreamOutput.tsx         ← 串流文字輸出（<pre> + auto-scroll）
│       ├── SynthesisView.tsx        ← Phase: synthesizing/complete
│       ├── CoordinatorPanel.tsx     ← Coordinator Markdown 串流
│       ├── WorkerSummaryPanel.tsx   ← Worker 摘要側邊欄
│       ├── WorkerSummaryCard.tsx    ← 單一 Worker 摘要卡片
│       ├── ErrorView.tsx            ← Phase: error
│       ├── SynthesizeButton.tsx     ← Synthesize CTA
│       └── __tests__/
│           ├── OrchestratorPage.test.tsx
│           ├── TaskPlanner.test.tsx
│           ├── WorkerGrid.test.tsx
│           ├── WorkerPane.test.tsx
│           ├── SynthesisView.test.tsx
│           └── ErrorView.test.tsx
```

### 刪除的檔案

```
packages/client/src/components/OrchestratorPanel/
├── OrchestratorPanel.tsx    ← 被 OrchestratorPage.tsx 取代
├── DispatchForm.tsx         ← 被 TaskPlanner.tsx 取代
├── WorkerCard.tsx           ← 被 WorkerPane.tsx 取代
├── WorkerPanel.tsx          ← 被 WorkerGrid.tsx 取代
└── __tests__/
    ├── OrchestratorPanel.test.tsx  ← 重寫
    ├── DispatchForm.test.tsx       ← 重寫
    ├── WorkerCard.test.tsx         ← 重寫
    └── WorkerPanel.test.tsx        ← 重寫
```

---

## Store 調整

### orchestratorStore 新增/修改

```typescript
interface OrchestratorState {
  // 現有（保留）
  orchestratorId: string;
  coordinatorId: string;
  provider: ChatProvider;
  status: OrchestratorStatus;
  workers: WorkerInfo[];
  aggregatedStats?: ChatStats;

  // 新增
  error?: string;                    // Error 階段的錯誤訊息
}
```

Store actions 不需大幅調整，`useOrchestratorSocket.ts` 的 event handler 可複用。

---

## 實作階段

### Stage 1: 基礎建設（shadcn/ui + Tailwind）

**目標**：建立 UI 基礎設施

1. 安裝 Tailwind CSS v4 + shadcn/ui
2. 設定 dark theme（基於現有色彩系統）
3. 安裝 `react-resizable-panels`
4. 複製需要的 shadcn 元件（Button、Card、Badge、Progress）

**驗證**：
```bash
pnpm --filter client exec tsc --noEmit
pnpm --filter client dev  # 手動確認 Tailwind 生效
```

### Stage 2: OrchestratorPage + PhaseHeader

**目標**：建立 Phase-Driven 路由骨架

1. 建立 `OrchestratorPage.tsx`：根據 status 渲染不同元件
2. 建立 `PhaseHeader.tsx`：顯示狀態文字 + 進度條
3. 每個 Phase 先用 placeholder（`<div>Phase: {status}</div>`）

**驗證**：
```bash
pnpm --filter client exec vitest run
# 手動測試：建立 orchestrator，確認 Phase 切換
```

### Stage 3: TaskPlanner（idle Phase）

**目標**：重寫任務規劃介面

1. 建立 `TaskPlanner.tsx`：react-hook-form + zod，全螢幕居中佈局
2. 從 `DispatchForm.tsx` 遷移表單邏輯
3. 加上 shadcn/ui Button、Input 元件
4. 寫測試

**驗證**：
```bash
pnpm --filter client exec vitest run
```

### Stage 4: WorkerGrid + WorkerPane（workers-running Phase）

**目標**：核心畫面——Worker 平行監控面板

1. 建立 `WorkerGrid.tsx`：根據 worker 數量決定 panel 佈局
2. 建立 `WorkerPane.tsx`：react-resizable-panels 內的單一面板
3. 建立 `WorkerPaneHeader.tsx`：狀態圖示 + Task + Stats
4. 建立 `StreamOutput.tsx`：`<pre>` + auto-scroll + event batching
5. 寫測試

**event batching 實作**：
```typescript
// StreamOutput.tsx 內
const [displayText, setDisplayText] = useState('');
const bufferRef = useRef('');

useEffect(() => {
  bufferRef.current = text;
  // 100ms 間隔更新顯示
  const timer = setInterval(() => {
    setDisplayText(bufferRef.current);
  }, 100);
  return () => clearInterval(timer);
}, [text]);
```

**驗證**：
```bash
pnpm --filter client exec vitest run
# 手動測試：Dispatch tasks，確認 Worker 面板即時更新
```

### Stage 5: SynthesisView（synthesizing/complete Phase）

**目標**：彙整結果的左右分割佈局

1. 建立 `SynthesisView.tsx`：左右 resizable panels
2. 建立 `CoordinatorPanel.tsx`：react-markdown 串流渲染
3. 建立 `WorkerSummaryPanel.tsx` + `WorkerSummaryCard.tsx`
4. 寫測試

**驗證**：
```bash
pnpm --filter client exec vitest run
# 手動測試：完整 Orchestrator 流程 → Synthesize → 確認佈局
```

### Stage 6: ErrorView + 收尾

**目標**：錯誤處理 + 清理

1. 建立 `ErrorView.tsx`：錯誤訊息 + partial results + 重試
2. 建立 `DispatchingOverlay.tsx`：過渡動畫
3. 刪除舊的 OrchestratorPanel 元件
4. 更新 TerminalTabs 中的 orchestrator tab 引用
5. 全面測試

**驗證**：
```bash
pnpm --filter client exec tsc --noEmit
pnpm --filter client exec vitest run
pnpm biome check packages/client/
```

---

## 關鍵實作細節

### Worker Grid 面板佈局邏輯

```typescript
function getGridLayout(count: number): 'single' | 'vertical' | 'top2-bottom1' | 'grid2x2' | 'scrollGrid' {
  if (count === 1) return 'single';
  if (count === 2) return 'vertical';
  if (count === 3) return 'top2-bottom1';
  if (count === 4) return 'grid2x2';
  return 'scrollGrid';
}
```

### StreamOutput 效能策略

1. **Batching**：100ms 間隔合併 socket events 到 DOM
2. **Max buffer**：超過 100K 字元時截斷頭部
3. **Auto-scroll**：只在使用者未手動捲動時自動捲到底部
4. **requestAnimationFrame**：DOM 更新用 rAF 避免 layout thrashing

### Phase 切換動畫

```tsx
// OrchestratorPage.tsx
<AnimatePresence mode="wait">
  {status === 'idle' && <motion.div key="idle" ...><TaskPlanner /></motion.div>}
  {status === 'workers-running' && <motion.div key="workers" ...><WorkerGrid /></motion.div>}
  {/* ... */}
</AnimatePresence>
```

考量：framer-motion 可能 bundle size 太大。替代方案：
- CSS transition + `data-phase` attribute
- `@view-transition` API（實驗性）
- 不加動畫（最簡單，效能最好）

**建議**：先不加動畫，MVP 完成後再評估是否需要。

---

## 依賴新增

```bash
# 必要
pnpm --filter client add react-resizable-panels

# shadcn/ui 系列（透過 CLI 安裝個別元件）
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card badge progress
```

Tailwind CSS v4 + shadcn/ui 的 Vite 設定需要額外調整（postcss、tailwind.config）。

---

## 風險與對策

| 風險 | 影響 | 對策 |
|------|------|------|
| Tailwind + 現有 CSS 衝突 | 樣式混亂 | 用 Tailwind prefix 或限定 scope |
| react-resizable-panels + xterm.js resize 事件 | Terminal 不自動 resize | 監聽 panel resize event 觸發 xterm fit |
| 4+ Workers 串流效能 | UI 卡頓 | Event batching 100ms + rAF |
| shadcn/ui 引入太多 bundle | 增加 bundle size | 只安裝需要的元件，tree-shaking |
| Phase 切換時 state 丟失 | Worker 結果消失 | Store 持久化 worker.result，不隨 Phase 清除 |

---

## 測試策略

### 單元測試

每個元件獨立測試：
- `TaskPlanner`：表單互動、validation、dispatch callback
- `WorkerPane`：status 變化、text 更新
- `SynthesisView`：Coordinator 內容渲染、Worker 摘要顯示
- `PhaseHeader`：status 文字、進度計算

### 整合測試

`OrchestratorPage` 整合測試：
- 完整 Phase 流程：idle → dispatch → workers-running → workers-complete → synthesize → complete
- Error 路徑
- Abort 路徑

### 效能測試（手動）

- 4 Workers 同時串流 10KB 文字
- 確認 UI 不卡頓、記憶體不洩漏
