# CLI Output Fixtures

These `.jsonl` files contain real CLI output captured from Claude and Gemini CLIs.
They drive parser unit tests (fixture-driven TDD) and are used to generate fake CLI scripts.

## Structure

```
__fixtures__/
├── claude/
│   ├── simple-text.jsonl          # Pure text response
│   ├── tool-use-read.jsonl        # tool_use + tool_result + text
│   └── ask-user-question.jsonl    # AskUserQuestion scenario
├── gemini/
│   ├── simple-text.jsonl          # Pure text response
│   └── tool-use-read.jsonl        # tool_use + tool_result + text
└── README.md
```

## How to capture new fixtures

### Claude CLI
```bash
claude -p --output-format stream-json --verbose "your prompt" 2>/dev/null | tee /tmp/claude-output.jsonl
```

### Gemini CLI
```bash
gemini -o stream-json "your prompt" 2>/dev/null | tee /tmp/gemini-output.jsonl
```

## Format reference

### Claude
- `{"type":"system","subtype":"init",...}` — session init
- `{"type":"assistant","message":{"content":[...]}}` — assistant response blocks
- `{"type":"user","message":{"content":[{"type":"tool_result",...}]}}` — auto tool results
- `{"type":"result","subtype":"success",...}` — completion stats

### Gemini
- `{"type":"init",...}` — session init
- `{"type":"message","role":"user"|"assistant",...}` — messages
- `{"type":"tool_use","tool_name":...,"tool_id":...,"parameters":...}` — tool calls
- `{"type":"tool_result","tool_id":...,"status":...,"output":...}` — tool results
- `{"type":"result","status":"success","stats":{...}}` — completion stats
