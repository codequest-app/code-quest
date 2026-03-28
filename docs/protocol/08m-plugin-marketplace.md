### 7.16 Plugin / Marketplace 系統

**方向**：WebView → Extension → CLI（同步命令）

**用途**：管理 Claude 插件的安裝、移除、啟停用，以及插件 Marketplace 的 CRUD 操作。Extension 透過 `spawnSync` 呼叫 Claude CLI 的 `plugin` 子命令。

---

#### 7.16.1 Plugin 操作

##### 列出插件（list_plugins）

**位置**：第 19018–19060 行

```
WebView ──(list_plugins { includeAvailable? })──→ Extension
  ↓
CLI command: claude plugin list --json [--available]
  ↓
回應：
{
  type: "list_plugins_response",
  installed: [
    {
      name: "plugin-id",
      manifest: { name: "plugin-id", version: "1.0.0" },
      path: "/install/path",
      source: "plugin-id",
      enabled: true,
      mcpServers: { ... }
    }
  ],
  available: [
    {
      entry: { name: "Plugin Name", description: "說明" },
      marketplaceName: "marketplace-name",
      pluginId: "plugin-id",
      isInstalled: false,
      source: "source-type",
      installCount: 42
    }
  ],
  errors: []
}
```

##### 安裝插件（install_plugin）

**位置**：第 19096–19102 行

```
WebView ──(install_plugin { pluginId, scope })──→ Extension
  ↓
CLI command: claude plugin install <pluginId> --scope <scope>
  ↓
回應：{ type: "install_plugin_response", needsRestart: true }
```

`scope` 可為 `"user"`、`"project"`、`"global"`。

##### 移除插件（uninstall_plugin）

**位置**：第 19103–19109 行

```
WebView ──(uninstall_plugin { pluginId })──→ Extension
  ↓
CLI command: claude plugin uninstall <pluginId>
  ↓
回應：{ type: "uninstall_plugin_response", needsRestart: true }
```

##### 啟停用插件（set_plugin_enabled）

**位置**：第 19110–19117 行

```
WebView ──(set_plugin_enabled { pluginId, enabled })──→ Extension
  ↓
CLI command: claude plugin enable|disable <pluginId>
  ↓
回應：{ type: "set_plugin_enabled_response", needsRestart: true }
```

> **注意**：安裝、移除、啟停用操作都需要重啟（`needsRestart: true`）。

---

#### 7.16.2 Marketplace 操作

##### 列出 Marketplace（list_marketplaces）

**位置**：第 19061–19077 行

```
WebView ──(list_marketplaces)──→ Extension
  ↓
CLI command: claude plugin marketplace list --json
  ↓
回應：
{
  type: "list_marketplaces_response",
  marketplaces: [
    {
      name: "marketplace-name",
      config: {
        source: { source: "github", repo: "owner/repo" },
        installLocation: "/path"
      },
      pluginCount: 0,
      installedCount: 0
    }
  ]
}
```

##### 新增 Marketplace（add_marketplace）

**位置**：第 19118–19124 行

```
WebView ──(add_marketplace { source })──→ Extension
  ↓
CLI command: claude plugin marketplace add <source>
  ↓
回應：{ type: "add_marketplace_response" }
```

##### 移除 Marketplace（remove_marketplace）

**位置**：第 19125–19131 行

```
WebView ──(remove_marketplace { marketplaceId })──→ Extension
  ↓
CLI command: claude plugin marketplace remove <marketplaceId>
  ↓
回應：{ type: "remove_marketplace_response" }
```

##### 刷新 Marketplace（refresh_marketplace）

**位置**：第 19132–19138 行

```
WebView ──(refresh_marketplace { marketplaceId })──→ Extension
  ↓
CLI command: claude plugin marketplace update <marketplaceId>
  ↓
回應：{ type: "refresh_marketplace_response" }
```

> Marketplace 操作不需要重啟。

---

#### 7.16.3 Marketplace Source 類型

**位置**：第 19078–19095 行（`buildMarketplaceSource`）

| Source 類型 | 欄位 | 範例 |
|------------|------|------|
| `github` | `repo` | `{ source: "github", repo: "owner/repo" }` |
| `git` | `url` | `{ source: "git", url: "https://..." }` |
| `url` | `url` | `{ source: "url", url: "https://..." }` |
| `directory` | `path` | `{ source: "directory", path: "/local/path" }` |
| `file` | `path` | `{ source: "file", path: "/path/to/file.zip" }` |
| `npm` | `package` | `{ source: "npm", package: "package-name" }` |

---

#### 7.16.4 CLI 命令執行方式

**位置**：第 19000–19016 行

所有 plugin 操作透過 `spawnSync` 同步執行 CLI：

```javascript
spawnSync(claudeBinary, [...executableArgs, ...pluginArgs], {
  cwd: cwd,
  env: { ...process.env, ...customEnv },
  encoding: "utf-8",
  timeout: 30000  // 30 秒超時
});
```

- 輸出以 JSON 格式解析（`--json` flag）
- 非零 exit code 會拋出錯誤
