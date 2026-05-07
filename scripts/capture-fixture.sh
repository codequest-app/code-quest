#!/usr/bin/env bash
set -euo pipefail
FIXTURE_DIR="apps/summoner/src/__fixtures__/claude"
NAME="${1:?Usage: capture-fixture.sh <name> [prompt]}"
PROMPT="${2:-}"
OUTPUT="$FIXTURE_DIR/$NAME.jsonl"
[[ -f "$OUTPUT" ]] && { echo "Already exists: $OUTPUT"; exit 1; }
if [[ -n "$PROMPT" ]]; then
  claude --output-format stream-json --verbose -p "$PROMPT" > "$OUTPUT"
else
  claude --output-format stream-json --input-format stream-json --verbose > "$OUTPUT"
fi
echo "Captured $(wc -l < "$OUTPUT") lines → $OUTPUT"
