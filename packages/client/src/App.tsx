import { useMemo } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { createSocket } from './socket/client';
import './App.css';

export function App() {
  const socket = useMemo(() => createSocket(), []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg text-text">
      <ChatPanel socket={socket} />
    </div>
  );
}
