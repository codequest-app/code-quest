#!/bin/bash
# Mock Claude CLI that echoes back the last argument (the user message)
# Usage: bash mock-claude-echo.sh [flags...] "message"

# Get the last argument as the message
MESSAGE="${@: -1}"

echo '{"type":"system","subtype":"init","session_id":"mock-echo-123"}'
sleep 0.1
echo "{\"type\":\"assistant\",\"message\":{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"Echo: ${MESSAGE}\"}]}}"
sleep 0.1
echo '{"type":"result","total_cost_usd":0.001,"duration_ms":200,"input_tokens":10,"output_tokens":5}'
