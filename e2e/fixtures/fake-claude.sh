#!/bin/bash
# Fake Claude CLI — persistent process that reads messages from stdin.
#
# Modes:
#   FIXTURE=echo                — echo back stdin lines in the response text (default)
#   FIXTURE=path/to/file.jsonl  — replay a fixture file
#
# Usage:
#   echo "hello" | bash fake-claude.sh -p
#   FIXTURE=echo bash fake-claude.sh -p
#   FIXTURE=/path/to/fixture.jsonl bash fake-claude.sh -p

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FIXTURE="${FIXTURE:-$SCRIPT_DIR/fixtures/claude-simple-text.jsonl}"

# Echo mode: persistent process reading messages from stdin
if [ "$FIXTURE" = "echo" ]; then
  echo '{"type":"system","subtype":"init","session_id":"mock-echo-'$$'"}'
  while IFS= read -r MESSAGE; do
    [ -z "$MESSAGE" ] && continue
    sleep 0.05
    ESCAPED_MSG=$(echo "$MESSAGE" | sed 's/"/\\"/g')
    echo "{\"type\":\"assistant\",\"message\":{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"Echo: ${ESCAPED_MSG}\"}]}}"
    sleep 0.05
    echo '{"type":"result","subtype":"success","total_cost_usd":0.001,"duration_ms":200,"usage":{"input_tokens":10,"output_tokens":5}}'
  done
  exit 0
fi

# Fixture replay mode (interactive)
# Reads first line (init) immediately, then waits for stdin before replaying the rest.
if [ ! -f "$FIXTURE" ]; then
  echo "Fixture not found: $FIXTURE" >&2
  exit 1
fi

# Read all fixture lines into an array
LINES=()
while IFS= read -r line; do
  [ -z "$line" ] && continue
  LINES+=("$line")
done < "$FIXTURE"

if [ ${#LINES[@]} -eq 0 ]; then
  echo "Empty fixture: $FIXTURE" >&2
  exit 1
fi

# Emit init line immediately
echo "${LINES[0]}"

# Wait for each stdin message, then replay the next chunk of fixture lines
# (skip init line, replay remaining on first message, then stay alive for multi-turn)
REPLAYED=false
while IFS= read -r MESSAGE; do
  [ -z "$MESSAGE" ] && continue

  if [ "$REPLAYED" = false ]; then
    REPLAYED=true
    for (( i=1; i<${#LINES[@]}; i++ )); do
      echo "${LINES[$i]}"
      sleep 0.05
    done
  else
    # Subsequent messages: echo back (multi-turn fallback)
    ESCAPED_MSG=$(echo "$MESSAGE" | sed 's/"/\\"/g')
    echo "{\"type\":\"assistant\",\"message\":{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"Echo: ${ESCAPED_MSG}\"}]}}"
    sleep 0.05
    echo '{"type":"result","subtype":"success","total_cost_usd":0.001,"duration_ms":200,"usage":{"input_tokens":10,"output_tokens":5}}'
  fi
done
