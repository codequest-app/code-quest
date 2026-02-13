/**
 * Simulates what the browser does:
 * 1. orchestrator:create → gets orchestrator:created (orchId, coordinatorId)
 * 2. User types in ChatPanel → chat:send(coordinatorId, message)
 * 3. Server responds via chat:event(coordinatorId, ...) → ChatPanel renders
 *
 * This test verifies the coordinator chat actually responds.
 */
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', { transports: ['websocket'] });

let coordinatorId = null;
const chatEvents = [];

socket.on('connect', () => {
  console.log('[browser] connected to server');
  console.log('[browser] clicking "+ Orchestrator" button...');
  socket.emit('orchestrator:create', { provider: 'claude' });
});

// This is what useOrchestratorSocket receives
socket.on('orchestrator:created', (orchId, coordId, provider) => {
  coordinatorId = coordId;
  console.log('[useOrchestratorSocket] orchestrator:created');
  console.log(`  → initChatSession(${coordId.slice(0, 8)}, ${provider})`);
  console.log(`  → addSession(${orchId.slice(0, 8)}, orchestrator)`);
  console.log();

  // Simulate user typing in ChatPanel and pressing Send
  console.log('[browser] user types "Hello Claude, 請幫我分析 auth 系統" and clicks Send');
  console.log(`[useChatSocket] socket.emit(chat:send, ${coordId.slice(0, 8)}, message)`);
  console.log();
  socket.emit('chat:send', coordinatorId, 'Hello Claude, 請幫我分析 auth 系統');
});

// This is what useChatSocket receives — the KEY question
socket.on('chat:event', (sessionId, event) => {
  chatEvents.push(event);
  if (sessionId === coordinatorId) {
    switch (event.type) {
      case 'thinking':
        console.log('[chat:event → chatStore] thinking:', event.data.content);
        break;
      case 'text':
        console.log('[chat:event → chatStore] text:', event.data.content);
        break;
      case 'init':
        console.log('[chat:event → chatStore] init, cliSessionId:', event.data.sessionId);
        break;
      default:
        console.log('[chat:event → chatStore]', event.type);
    }
  }
});

socket.on('chat:complete', (sessionId, stats) => {
  if (sessionId === coordinatorId) {
    console.log('[chat:complete → chatStore] stats:', JSON.stringify(stats));
    console.log();

    // Summary
    console.log('=== RESULT ===');
    const textEvents = chatEvents.filter((e) => e.type === 'text');
    const fullText = textEvents.map((e) => e.data.content).join('');
    console.log('Coordinator responded:', textEvents.length > 0 ? 'YES ✓' : 'NO ✗');
    console.log('Response text:', fullText);
    console.log('Chat events received:', chatEvents.length);
    console.log();

    if (textEvents.length > 0) {
      console.log('→ ChatPanel WILL render this response in the UI');
    } else {
      console.log('→ ChatPanel will show NOTHING — there is a bug!');
    }

    socket.disconnect();
    process.exit(0);
  }
});

socket.on('chat:error', (sessionId, message) => {
  if (sessionId === coordinatorId) {
    console.log('[chat:error]', message);
  }
});

setTimeout(() => {
  console.log('\n=== TIMEOUT — no response received ===');
  console.log('Chat events so far:', chatEvents.length);
  socket.disconnect();
  process.exit(1);
}, 8000);
