# Real JSON Samples — Protocol Events

> Extracted from `apps/server/data/code-quest.db` (raw_entries table)
> One sample per type/subtype. Use as test fixtures and schema validation references.
> Updated: 2026-04-17

---

## Control Request Subtypes (cc-office → CLI)

### reload_plugins

```json
{
  "request_id": "97519c04-348e-4c8f-89b9-b677f074cfa3",
  "type": "control_request",
  "request": {
    "subtype": "reload_plugins"
  }
}
```

**Corresponding control_response:**
```json
{
  "type": "control_response",
  "response": {
    "subtype": "success",
    "request_id": "97519c04-348e-4c8f-89b9-b677f074cfa3",
    "response": {
      "commands": [
        { "name": "simplify", "description": "Review changed code...", "argumentHint": "" },
        { "name": "tdd", "description": "TDD best practices...", "argumentHint": "" }
      ],
      "agents": [...],
      "plugins": [...],
      "mcpServers": [...]
    }
  }
}
```

> Note: `response.commands` is the full slash commands list post-reload.
> The outer `{ success: true, response: { commands: [...] } }` is the `ControlResponse` wrapper from `ch.sendRequest()`.

---

## System Subtypes (CLI → cc-office)

### mirror_error

> Not yet observed in DB. Synthetic fixture used:

```json
{
  "type": "system",
  "subtype": "mirror_error",
  "error": "Failed to write transcript",
  "key": { "sessionId": "sess-abc" },
  "uuid": "uuid-mirror-1",
  "session_id": "sess-abc"
}
```

Source: `apps/summoner/src/__fixtures__/claude/synthetic/system-mirror-error.jsonl`

---

## Outbound Subtypes (not yet seen in DB)

### seed_read_state

Not yet in DB (requires channel with active session syncing file read state).
Synthetic fixture: `control-seed-read-state.jsonl` (to be created when needed).

### channel_enable

Not yet in DB (requires MCP channel enable flow).
Synthetic fixture: `control-channel-enable.jsonl` (to be created when needed).

### ultrareview_launch

Not yet in DB (requires ultrareview feature).
Synthetic fixture: `apps/summoner/src/__fixtures__/claude/synthetic/control-ultrareview-launch.jsonl`

---

## How to Extract New Samples

```sql
-- By type
SELECT raw FROM raw_entries
WHERE json_extract(raw, '$.type') = 'system'
  AND json_extract(raw, '$.subtype') = 'NEW_SUBTYPE'
LIMIT 1;

-- By control_request subtype
SELECT raw FROM raw_entries
WHERE json_extract(raw, '$.type') = 'control_request'
  AND json_extract(raw, '$.request') LIKE '%NEW_SUBTYPE%'
LIMIT 1;

-- Get matching control_response
SELECT raw FROM raw_entries
WHERE json_extract(raw, '$.type') = 'control_response'
  AND raw LIKE '%REQUEST_ID%'
LIMIT 1;
```
