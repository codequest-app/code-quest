---
name: collect-cli-fixtures
description: Collects real CLI (Claude, Gemini) stream-json output as .jsonl fixture files. Use when adding new fixture scenarios, updating after CLI version changes, or covering new protocol event types.
---

# Collect CLI Fixtures

## Capture Script

```bash
scripts/capture-fixture.sh <name> [prompt]
```

### Print mode
```bash
claude --output-format stream-json -p "say hello" 2>/dev/null > /tmp/claude-simple-text.jsonl
```

### Interactive mode (control protocol)
```bash
mkfifo /tmp/claude-stdin
claude --output-format stream-json --input-format stream-json --verbose \
  < /tmp/claude-stdin 2>/dev/null | tee /tmp/claude-interactive.jsonl &
exec 3>/tmp/claude-stdin
# Send control_request JSON via fd 3, sleep between requests
exec 3>&-; kill %1 2>/dev/null; rm /tmp/claude-stdin
```

### From DB
```bash
mysql -u root -h 127.0.0.1 -P 3306 code_quest -N -e \
  "SELECT raw FROM raw_entries WHERE raw LIKE '{\"type\":\"<type>\"%' LIMIT 1;"
```

## Validation

```bash
# Every line must be valid JSON
while IFS= read -r line; do
  echo "$line" | jq . > /dev/null 2>&1 || echo "INVALID: $line"
done < /tmp/fixture.jsonl

# Check event type distribution
cat /tmp/fixture.jsonl | jq -r '.type' | sort | uniq -c
```

## Sanitization

```bash
sed -i '' 's/"session_id":"[^"]*"/"session_id":"test-session-id"/g' fixture.jsonl
grep -l "sk-" fixture.jsonl  # Check for API key leaks
```

## Destination

```
packages/summoner/src/__fixtures__/claude/
├── real/<name>.jsonl        # From DB or real CLI
└── synthetic/<name>.jsonl   # Hand-crafted (mark for future replacement)
```

## Checklist

- [ ] CLI installed and working
- [ ] Fixture captured from real CLI (never hand-written)
- [ ] Every line is valid JSON
- [ ] Sensitive data sanitized
- [ ] Placed in correct directory (real/ or synthetic/)
- [ ] Tracking doc updated (`docs/fixture-capture-tracking.md`)

## Reference

- Tracking: `docs/fixture-capture-tracking.md`
- Fixture-Driven TDD: `/fixture-driven-tdd`
