import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', { transports: ['websocket'] });

let orchId = null;
let coordId = null;
let coordDone = false;

socket.on('connect', () => {
  console.log('=== 1. Connected ===');
  socket.emit('orchestrator:create', { provider: 'claude' });
});

socket.on('orchestrator:created', (id, cid, _provider) => {
  orchId = id;
  coordId = cid;
  console.log('=== 2. Orchestrator created ===');
  console.log('   orchId:', id.slice(0, 8));
  console.log('   coordinator:', cid.slice(0, 8));
  console.log();
  console.log('=== 3. Sending message to coordinator ===');
  socket.emit('chat:send', coordId, '分析 auth 系統');
});

socket.on('chat:event', (_sid, event) => {
  if (event.type === 'text') process.stdout.write(event.data.content);
  if (event.type === 'thinking') console.log('[thinking]', event.data.content);
});

socket.on('chat:complete', (_sid, _stats) => {
  if (coordDone) return;
  coordDone = true;
  console.log('\n=== 4. Coordinator replied, dispatching 2 workers ===\n');
  socket.emit('orchestrator:dispatch', orchId, [
    { description: 'Code review auth module', provider: 'claude' },
    { description: 'Security audit on login flow', provider: 'gemini' },
  ]);
});

socket.on('orchestrator:dispatched', (_id, workers) => {
  for (const [i, w] of workers.entries()) {
    console.log(`   Worker ${i + 1}:`, w.task.description, `(${w.task.provider})`);
  }
  console.log();
});

socket.on('orchestrator:status', (_id, status) => {
  console.log('   [status]', status);
});

socket.on('orchestrator:worker-event', (_oid, wid, event) => {
  if (event.type === 'text') process.stdout.write(`[${wid.slice(0, 6)}] ${event.data.content}`);
});

socket.on('orchestrator:worker-complete', (_oid, wid, result) => {
  console.log('\n   [worker done]', wid.slice(0, 6), '-', result.status);
});

socket.on('orchestrator:all-complete', (_oid, results) => {
  console.log('\n=== 5. All workers complete ===');
  for (const [i, r] of results.entries()) {
    console.log(`   Worker ${i + 1}:`, r.status, '- output:', (r.result || '').slice(0, 60));
  }
  console.log();
  console.log('=== 6. Synthesizing ===');
  socket.emit('orchestrator:synthesize', orchId);
});

setTimeout(() => {
  console.log('\n\n=== Test complete ===');
  socket.disconnect();
  process.exit(0);
}, 12000);
