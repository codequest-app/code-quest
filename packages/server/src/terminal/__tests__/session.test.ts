import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TerminalSessionImpl } from '../session';
import type { TerminalSessionOptions } from '../types';

describe('TerminalSession', () => {
  let session: TerminalSessionImpl;

  afterEach(() => {
    if (session?.isAlive) {
      session.kill();
    }
  });

  describe('constructor', () => {
    it('should create a session with default options', () => {
      session = new TerminalSessionImpl();

      expect(session.id).toBeTruthy();
      expect(session.pid).toBeGreaterThan(0);
      expect(session.isAlive).toBe(true);
    });

    it('should create a session with custom options', () => {
      const options: TerminalSessionOptions = {
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
        cols: 100,
        rows: 30,
        cwd: process.cwd(),
      };

      session = new TerminalSessionImpl(options);

      expect(session.id).toBeTruthy();
      expect(session.pid).toBeGreaterThan(0);
      expect(session.isAlive).toBe(true);
    });

    it('should generate unique IDs for different sessions', () => {
      const session1 = new TerminalSessionImpl();
      const session2 = new TerminalSessionImpl();

      expect(session1.id).not.toBe(session2.id);

      session1.kill();
      session2.kill();
    });
  });

  describe('write', () => {
    beforeEach(() => {
      session = new TerminalSessionImpl();
    });

    it('should write data to terminal', async () => {
      const dataReceived: string[] = [];
      session.onData((data) => {
        dataReceived.push(data);
      });

      // Write a simple command
      session.write('echo "Hello World"\n');

      // Wait for output
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should receive some data back
      expect(dataReceived.length).toBeGreaterThan(0);
      expect(dataReceived.join('')).toContain('Hello World');
    });

    it('should handle multiple writes', async () => {
      const dataReceived: string[] = [];
      session.onData((data) => {
        dataReceived.push(data);
      });

      session.write('echo "Line 1"\n');
      session.write('echo "Line 2"\n');

      await new Promise((resolve) => setTimeout(resolve, 100));

      const output = dataReceived.join('');
      expect(output).toContain('Line 1');
      expect(output).toContain('Line 2');
    });
  });

  describe('resize', () => {
    beforeEach(() => {
      session = new TerminalSessionImpl({ cols: 80, rows: 24 });
    });

    it('should resize terminal dimensions', () => {
      expect(() => {
        session.resize({ cols: 120, rows: 40 });
      }).not.toThrow();
    });

    it('should handle multiple resizes', () => {
      expect(() => {
        session.resize({ cols: 100, rows: 30 });
        session.resize({ cols: 80, rows: 20 });
        session.resize({ cols: 120, rows: 50 });
      }).not.toThrow();
    });
  });

  describe('kill', () => {
    it('should kill the terminal session', () => {
      session = new TerminalSessionImpl();
      expect(session.isAlive).toBe(true);

      session.kill();

      expect(session.isAlive).toBe(false);
    });

    it('should trigger onExit callback', async () => {
      session = new TerminalSessionImpl();
      const exitCallback = vi.fn();

      session.onExit(exitCallback);
      session.kill();

      // Wait for exit callback
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(exitCallback).toHaveBeenCalledOnce();
      expect(exitCallback).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should not throw when killing already dead session', () => {
      session = new TerminalSessionImpl();
      session.kill();

      expect(() => {
        session.kill();
      }).not.toThrow();
    });
  });

  describe('onData', () => {
    beforeEach(() => {
      session = new TerminalSessionImpl();
    });

    it('should register data callback', async () => {
      const dataCallback = vi.fn();
      session.onData(dataCallback);

      session.write('echo "test"\n');

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(dataCallback).toHaveBeenCalled();
      expect(dataCallback.mock.calls.some((call) => call[0].includes('test'))).toBe(true);
    });

    it('should support multiple data callbacks', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      session.onData(callback1);
      session.onData(callback2);

      session.write('echo "test"\n');

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('onExit', () => {
    it('should register exit callback', async () => {
      session = new TerminalSessionImpl();
      const exitCallback = vi.fn();

      session.onExit(exitCallback);

      // Kill session to trigger exit
      session.kill();

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(exitCallback).toHaveBeenCalledOnce();
    });

    it('should support multiple exit callbacks', async () => {
      session = new TerminalSessionImpl();
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      session.onExit(callback1);
      session.onExit(callback2);

      session.kill();

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(callback1).toHaveBeenCalledOnce();
      expect(callback2).toHaveBeenCalledOnce();
    });
  });

  describe('error handling', () => {
    it('should handle invalid shell command gracefully', () => {
      const options: TerminalSessionOptions = {
        shell: '/nonexistent/shell',
      };

      expect(() => {
        session = new TerminalSessionImpl(options);
      }).toThrow();
    });

    it('should not write to killed session', () => {
      session = new TerminalSessionImpl();
      session.kill();

      expect(() => {
        session.write('echo "test"\n');
      }).not.toThrow();
    });

    it('should not resize killed session', () => {
      session = new TerminalSessionImpl();
      session.kill();

      expect(() => {
        session.resize({ cols: 100, rows: 30 });
      }).not.toThrow();
    });
  });
});
