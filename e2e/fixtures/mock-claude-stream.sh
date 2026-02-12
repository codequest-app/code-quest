#!/bin/bash
# Mock Claude CLI with realistic streaming delays
# Echoes the user message back with simulated thinking + text streaming
# Usage: bash mock-claude-stream.sh [flags...] "message"

# Get the last argument as the message
MESSAGE="${@: -1}"

# Generate a unique session ID based on PID
SESSION_ID="mock-session-$$"

# Init
echo "{\"type\":\"system\",\"subtype\":\"init\",\"session_id\":\"${SESSION_ID}\"}"
sleep 0.2

# Thinking
echo "{\"type\":\"assistant\",\"message\":{\"role\":\"assistant\",\"content\":[{\"type\":\"thinking\",\"thinking\":\"Let me think about: ${MESSAGE}\"}]}}"
sleep 0.3

# Text response - stream in chunks
echo "{\"type\":\"assistant\",\"message\":{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"I received your request: \"}]}}"
sleep 0.2
echo "{\"type\":\"assistant\",\"message\":{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"${MESSAGE}. \"}]}}"
sleep 0.3
echo "{\"type\":\"assistant\",\"message\":{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"Here is my analysis and response to your task. \"}]}}"
sleep 0.2
echo "{\"type\":\"assistant\",\"message\":{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"The task has been completed successfully.\"}]}}"
sleep 0.1

# Result
echo "{\"type\":\"result\",\"total_cost_usd\":0.003,\"duration_ms\":1200,\"input_tokens\":150,\"output_tokens\":80}"
