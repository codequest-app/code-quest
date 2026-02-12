#!/bin/bash
# Mock Gemini CLI - persistent process that reads from stdin

echo '{"type":"init","session_id":"gemini-mock-456"}'

while IFS= read -r line; do
  [ -z "$line" ] && continue
  sleep 0.3
  echo "{\"type\":\"message\",\"role\":\"assistant\",\"content\":\"Hello from Gemini!\",\"delta\":true}"
  sleep 0.3
  echo '{"type":"result","status":"success","stats":{"input_tokens":20,"output_tokens":10,"duration_ms":400}}'
done
