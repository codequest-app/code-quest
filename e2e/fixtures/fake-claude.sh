#!/bin/bash
# Fake Claude CLI — reads fixture JSONL and outputs line-by-line with delays.
#
# Modes:
#   FIXTURE=path/to/file.jsonl  — replay a fixture file (default: claude-simple-text.jsonl)
#   FIXTURE=echo                — echo back the last CLI argument in the response text
#
# Usage:
#   bash fake-claude.sh "message"
#   FIXTURE=echo bash fake-claude.sh "hello world"
#   FIXTURE=/path/to/fixture.jsonl bash fake-claude.sh "message"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FIXTURE="${FIXTURE:-$SCRIPT_DIR/fixtures/claude-simple-text.jsonl}"
MESSAGE="${@: -1}"

# Echo mode: generate a minimal stream-json response echoing the message
if [ "$FIXTURE" = "echo" ]; then
  echo '{"type":"system","subtype":"init","session_id":"mock-echo-'$$'"}'
  sleep 0.05
  # Escape double quotes in message for JSON safety
  ESCAPED_MSG=$(echo "$MESSAGE" | sed 's/"/\\"/g')
  echo "{\"type\":\"assistant\",\"message\":{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"Echo: ${ESCAPED_MSG}\"}]}}"
  sleep 0.05
  echo '{"type":"result","subtype":"success","total_cost_usd":0.001,"duration_ms":200,"usage":{"input_tokens":10,"output_tokens":5}}'
  exit 0
fi

# Fixture replay mode
if [ ! -f "$FIXTURE" ]; then
  echo "Fixture not found: $FIXTURE" >&2
  exit 1
fi

while IFS= read -r line; do
  [ -z "$line" ] && continue
  echo "$line"
  sleep 0.05
done < "$FIXTURE"
