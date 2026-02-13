#!/usr/bin/env node
/**
 * E2E test: AskUserQuestion flow via socket.io
 * Requires: MOCK_CLI=shell server running on localhost:3000
 * Run: node e2e/test-ask-question-e2e.mjs
 */
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('✓ Connected to server');
  console.log('\n--- Step 1: Creating Claude chat session ---');
  socket.emit('chat:create', { provider: 'claude' });
});

socket.on('chat:created', (sessionId, provider) => {
  console.log(`✓ Chat created: sessionId=${sessionId}, provider=${provider}`);
  console.log('\n--- Step 2: Sending message ---');
  socket.emit('chat:send', sessionId, 'help me choose an approach');
});

const allEvents = [];

socket.on('chat:event', (_sessionId, event) => {
  allEvents.push(event);
  console.log(`  chat:event [${event.type}]`, JSON.stringify(event.data).slice(0, 150));

  // Check if this is an AskUserQuestion tool_use
  if (event.type === 'tool_use' && event.data.name === 'AskUserQuestion') {
    console.log('\n✅ AskUserQuestion tool_use DETECTED!');
    console.log('   Questions:', JSON.stringify(event.data.input?.questions, null, 2));
  }
});

socket.on('chat:complete', (_sessionId, stats) => {
  console.log(`\n--- Step 3: Chat complete ---`);
  console.log(`  stats:`, JSON.stringify(stats));

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total events: ${allEvents.length}`);
  const toolUses = allEvents.filter((e) => e.type === 'tool_use');
  const askQ = toolUses.find((e) => e.data.name === 'AskUserQuestion');
  console.log(`Tool uses: ${toolUses.map((e) => e.data.name).join(', ') || 'none'}`);
  console.log(`AskUserQuestion found: ${askQ ? 'YES ✅' : 'NO ❌'}`);

  if (askQ) {
    console.log(`\nThe UI should show QuestionPrompt with:`);
    const questions = askQ.data.input?.questions;
    if (questions) {
      for (const q of questions) {
        console.log(`  Header: ${q.header}`);
        console.log(`  Question: ${q.question}`);
        console.log(`  Options: ${q.options.map((o) => o.label).join(', ')}`);
      }
    }
  }

  setTimeout(() => {
    socket.disconnect();
    process.exit(0);
  }, 500);
});

socket.on('chat:error', (_sessionId, message) => {
  console.error(`❌ chat:error: ${message}`);
});

socket.on('connect_error', (err) => {
  console.error(`❌ Connection error: ${err.message}`);
  process.exit(1);
});

// Timeout
setTimeout(() => {
  console.error('❌ Timeout - no response after 15s');
  socket.disconnect();
  process.exit(1);
}, 15000);
