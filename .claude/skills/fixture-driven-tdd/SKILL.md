---
name: fixture-driven-tdd
description: Fixture-driven TDD workflow for CLI parsers and session tests. Uses real CLI JSON from DB/capture, FakeClaude segments, and .jsonl fixtures. Use when developing parsers, adding event types, or writing server pipeline tests.
---

# Fixture-Driven TDD

## Principle

> Test data must come from real CLI output, never guessed. Use DB exports or `capture-fixture.sh`.

## Fixture Locations

```
packages/summoner/src/__fixtures__/claude/
├── real/        # 40+ files — DB exports & real CLI recordings
└── synthetic/   # 18 files — hand-crafted for untriggerable events
```

Fixtures are auto-loaded by TEMPLATES in `packages/summoner/src/test/fake-claude.ts`.

## Workflow

### 1. Collect fixture

```bash
# Real CLI capture
scripts/capture-fixture.sh <name> [prompt]

# Or from DB
mysql -u root -h 127.0.0.1 -P 3306 code_quest -N -e \
  "SELECT raw FROM raw_entries WHERE raw LIKE '{\"type\":\"<event_type>\"%' LIMIT 1;"
```

DB connection in `packages/server/.env` → `DATABASE_URL`.

### 2. Add to fixtures

Save to `packages/summoner/src/__fixtures__/claude/real/<name>.jsonl` (or `synthetic/` if hand-crafted).

### 3. Add segment builder

In `packages/summoner/src/test/fake-claude.ts`, add to `segments` object:

```typescript
myEvent(param: string): string {
  const line = JSON.parse(TEMPLATES.MY_EVENT);
  line.some_field = param;
  line.uuid = `fake-my-event-${++_seq}`;
  return JSON.stringify(line);
}
```

### 4. Write test (RED)

```typescript
import { segments as s } from '@code-quest/summoner/test';

// Parser test
const parsed = adapter.parseLine(s.myEvent('test'));
expect(parsed.status).toBe('ok');

// Pipeline test
const claude = createFakeSummoner().claude();
const channelId = await claude.initialize(s.init('sess'));
await claude.emit(s.myEvent('test'));
expect(claude.received('message:my_event')).toHaveLength(1);
```

### 5. Implement (GREEN) → Refactor

## Anti-patterns

- Never hand-write JSON that pretends to be CLI output
- Never use `inline JSON` in tests — use `segments.*()` builders
- Synthetic fixtures must be clearly marked and tracked for replacement

## Reference

- Capture script: `scripts/capture-fixture.sh`
- Tracking: `docs/fixture-capture-tracking.md`
- Segment builders: `packages/summoner/src/test/fake-claude.ts` (60+ builders)
