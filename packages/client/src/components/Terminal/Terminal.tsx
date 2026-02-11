import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useSocket } from '../../hooks/useSocket';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  sessionId: string;
  serverUrl: string;
  className?: string;
  theme?: Record<string, string>;
}

const defaultTheme = {
  background: '#1e1e1e',
  foreground: '#ffffff',
  cursor: '#ffffff',
  cursorAccent: '#000000',
  selection: '#ffffff40',
  black: '#000000',
  red: '#cd3131',
  green: '#0dbc79',
  yellow: '#e5e510',
  blue: '#2472c8',
  magenta: '#bc3fbc',
  cyan: '#11a8cd',
  white: '#e5e5e5',
  brightBlack: '#666666',
  brightRed: '#f14c4c',
  brightGreen: '#23d18b',
  brightYellow: '#f5f543',
  brightBlue: '#3b8eea',
  brightMagenta: '#d670d6',
  brightCyan: '#29b8db',
  brightWhite: '#ffffff',
};

/**
 * Terminal component using xterm.js
 * Renders a terminal emulator connected to a backend session via Socket.io
 */
export function Terminal({
  sessionId,
  serverUrl,
  className = '',
  theme = defaultTheme,
}: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { socket, emit } = useSocket(serverUrl);

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (!containerRef.current || terminalRef.current) {
      return;
    }

    try {
      // Create terminal instance
      const terminal = new XTerm({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme,
      });

      terminalRef.current = terminal;

      // Create and load addons
      const fitAddon = new FitAddon();
      fitAddonRef.current = fitAddon;

      terminal.loadAddon(fitAddon);
      terminal.loadAddon(new WebLinksAddon());

      // Open terminal in container
      terminal.open(containerRef.current);

      // Handle user input
      terminal.onData((data) => {
        emit('terminal:write', sessionId, data);
      });

      // Handle terminal resize
      terminal.onResize(({ cols, rows }) => {
        emit('terminal:resize', sessionId, cols, rows);
      });

      // Use ResizeObserver to handle container size changes
      const resizeObserver = new ResizeObserver(() => {
        if (fitAddonRef.current) {
          try {
            fitAddonRef.current.fit();
          } catch (e) {
            // Ignore fit errors during rapid resizes
          }
        }
      });

      resizeObserver.observe(containerRef.current);

      // Initial fit after a small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (fitAddonRef.current) {
            try {
              fitAddon.fit();
            } catch (e) {
              // Ignore fit errors during initialization
            }
          }
        });
      });

      // Cleanup
      return () => {
        resizeObserver.disconnect();
        terminal.dispose();
        terminalRef.current = null;
      };
    } catch (error) {
      console.error('Failed to create terminal:', error);
    }
  }, [sessionId, theme, emit]);

  // Handle incoming data from server - use socket directly
  useEffect(() => {
    if (!socket) return;

    const handleData = (id: string, data: string) => {
      if (id === sessionId && terminalRef.current) {
        terminalRef.current.write(data);
      }
    };

    // Register listener directly on socket
    socket.on('terminal:data', handleData);

    // Cleanup: remove this specific listener
    return () => {
      socket.off('terminal:data', handleData);
    };
  }, [socket, sessionId]);

  return (
    <div
      ref={containerRef}
      className={`terminal-container ${className}`}
      data-testid="terminal-container"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
