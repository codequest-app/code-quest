#!/bin/bash
echo '{"type":"system","subtype":"init","session_id":"mock-123"}'
sleep 0.3
echo '{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"Hello!"}]}}'
sleep 0.3
echo '{"type":"result","total_cost_usd":0.001,"duration_ms":500}'
