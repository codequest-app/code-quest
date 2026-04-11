## MODIFIED Requirements

### Requirement: Client architecture

Client 架構新增 Activity Bar 與 Left Sidebar 層級。

原架構：
```
TabProvider
└── WorkspaceLayout
    ├── TabBar
    └── ChannelProvider (per tab)
        └── ChatPanel
```

新架構：
```
TabProvider
└── WorkspaceLayout (layout shell)
    ├── ActivityBar                    ← 新增
    ├── PanelGroup (horizontal)       ← 新增 (react-resizable-panels)
    │   ├── Panel (sidebar)           ← 新增
    │   │   └── FileExplorerPanel     ← 新增
    │   ├── PanelResizeHandle         ← 新增
    │   └── Panel (main)
    │       └── EditorArea            ← 從 WorkspaceLayout 提取（原邏輯不變）
    │           ├── TabBar
    │           └── ChannelProvider (per tab)
    │               └── ChatPanel
```

#### Scenario: WorkspaceLayout renders new structure
- **WHEN** App mounts
- **THEN** WorkspaceLayout renders ActivityBar + PanelGroup containing sidebar and main panels

#### Scenario: Existing ChatPanel functionality preserved
- **WHEN** new layout is active
- **THEN** all existing ChatPanel functionality (messaging, diff review, elicitation, raw events) works unchanged
