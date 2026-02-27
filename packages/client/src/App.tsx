import { useMemo } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { createSocket } from './socket/client';
import './App.css';

export function App() {
  const socket = useMemo(() => createSocket(), []);

  return (
    <div className="app">
      <ChatPanel socket={socket} />
    </div>
  );
}
