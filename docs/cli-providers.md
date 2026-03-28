# CLI Provider Capability Matrix

各 CLI provider 之間的功能差異記錄。當發現新差異時，請更新此表。

## Providers

| Provider | Command | Output Format | Input Format |
|----------|---------|---------------|--------------|
| Claude | `claude` | `stream-json` | `stream-json` |
| Gemini | `gemini` | TBD | TBD |

## Args Support

| Flag | Claude | Gemini | Notes |
|------|--------|--------|-------|
| `--output-format stream-json` | Yes | TBD | |
| `--input-format stream-json` | Yes | TBD | |
| `--verbose` | Yes | TBD | |
| `--permission-prompt-tool stdio` | Yes | No | Gemini 不支援，需用 `-p` 模式繞過 |
| `--resume <id>` | Yes | TBD | |

## Output Event Differences

| Event Type | Claude | Gemini | Notes |
|------------|--------|--------|-------|
| `system` (init/status) | Yes | TBD | |
| `stream_event` | Yes | TBD | |
| `control_request` (can_use_tool) | Yes | No | 需要 `--permission-prompt-tool stdio` |
| `control_response` | Yes | TBD | |
| `result` | Yes | TBD | |
| `assistant` | Yes | TBD | |
| `rate_limit_event` | Yes (ignored) | TBD | |

## Permission Handling

| Provider | Mechanism | Notes |
|----------|-----------|-------|
| Claude | `--permission-prompt-tool stdio` → `control_request` (can_use_tool) | CLI 透過 stdout 詢問權限，Extension 透過 stdin 回覆 |
| Gemini | N/A | 不支援 stdio 權限提示，需用 `-p` 模式或其他方式處理 |

## Known Limitations

### Gemini
- 不支援 `--permission-prompt-tool stdio`，無法透過 stdin/stdout 做權限互動
- 需要開發 `-p` (print mode) 支援作為替代方案
