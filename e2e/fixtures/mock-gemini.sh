#!/bin/bash
echo '{"type":"system","subtype":"init","session_id":"gemini-mock-456"}'
sleep 0.3
echo '{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"Hello from Gemini!"}]}}'
sleep 0.3
echo '{"type":"result","total_cost_usd":0.0005,"duration_ms":400,"input_tokens":20,"output_tokens":10}'
