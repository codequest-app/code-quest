import { useMemo } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { createSocket } from './socket/client';
import './App.css';

export function App() {
  const socket = useMemo(() => createSocket(), []);

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-[#e0e0e0] font-sans">
      <ChatPanel socket={socket} />
    </div>
  );
}
