#!/bin/bash
# Fake Gemini CLI — reads fixture JSONL and outputs line-by-line with delays.
# Usage: FIXTURE=path/to/fixture.jsonl bash fake-gemini.sh "message"
# Default fixture: gemini-simple-text.jsonl

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FIXTURE="${FIXTURE:-$SCRIPT_DIR/fixtures/gemini-simple-text.jsonl}"

if [ ! -f "$FIXTURE" ]; then
  echo "Fixture not found: $FIXTURE" >&2
  exit 1
fi

while IFS= read -r line; do
  [ -z "$line" ] && continue
  echo "$line"
  sleep 0.1
done < "$FIXTURE"
