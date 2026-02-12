#!/bin/bash
# Mock Claude CLI that echoes back messages from stdin (persistent process)
# Emits init on start, then reads lines from stdin and echoes them back

echo '{"type":"system","subtype":"init","session_id":"mock-echo-123"}'

while IFS= read -r line; do
  [ -z "$line" ] && continue
  sleep 0.1
  echo "{\"type\":\"assistant\",\"message\":{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"Echo: ${line}\"}]}}"
  sleep 0.1
  echo '{"type":"result","total_cost_usd":0.001,"duration_ms":200,"input_tokens":10,"output_tokens":5}'
done
