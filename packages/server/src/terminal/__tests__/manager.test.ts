import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TYPES } from '../../container.ts';
import { createTestContainer } from '../../test/create-test-container.ts';
import type { TerminalManager, TerminalSessionOptions } from '../types.ts';

describe('TerminalManager', () => {
  let manager: TerminalManager;

  beforeEach(() => {
    const container = createTestContainer();
    manager = container.get<TerminalManager>(TYPES.TerminalManager);
  });

  afterEach(() => {
    manager.cleanup();
  });

  describe('createSession', () => {
    it('should create a new session with default options', () => {
      const session = manager.createSession();

      expect(session).toBeDefined();
      expect(session.id).toBeTruthy();
      expect(session.isAlive).toBe(true);
    });

    it('should create a session with custom options', () => {
      const options: TerminalSessionOptions = {
        shell: '/bin/sh',
        cols: 100,
        rows: 30,
      };

      const session = manager.createSession(options);

      expect(session).toBeDefined();
      expect(session.id).toBeTruthy();
      expect(session.isAlive).toBe(true);
    });

    it('should track created sessions', () => {
      const session = manager.createSession();
      const foundSession = manager.getSession(session.id);

      expect(foundSession).toBe(session);
    });

    it('should create multiple unique sessions', () => {
      const session1 = manager.createSession();
      const session2 = manager.createSession();
      const session3 = manager.createSession();

      expect(session1.id).not.toBe(session2.id);
      expect(session2.id).not.toBe(session3.id);
      expect(session1.id).not.toBe(session3.id);

      const sessions = manager.listSessions();
      expect(sessions).toHaveLength(3);
    });
  });

  describe('getSession', () => {
    it('should return existing session by ID', () => {
      const session = manager.createSession();
      const foundSession = manager.getSession(session.id);

      expect(foundSession).toBe(session);
    });

    it('should return undefined for non-existent session', () => {
      const foundSession = manager.getSession('non-existent-id');

      expect(foundSession).toBeUndefined();
    });

    it('should return correct session among multiple sessions', () => {
      const session1 = manager.createSession();
      const session2 = manager.createSession();
      const session3 = manager.createSession();

      expect(manager.getSession(session1.id)).toBe(session1);
      expect(manager.getSession(session2.id)).toBe(session2);
      expect(manager.getSession(session3.id)).toBe(session3);
    });
  });

  describe('removeSession', () => {
    it('should remove existing session', () => {
      const session = manager.createSession();
      const removed = manager.removeSession(session.id);

      expect(removed).toBe(true);
      expect(manager.getSession(session.id)).toBeUndefined();
      expect(manager.listSessions()).toHaveLength(0);
    });

    it('should return false for non-existent session', () => {
      const removed = manager.removeSession('non-existent-id');

      expect(removed).toBe(false);
    });

    it('should kill session when removing', async () => {
      const session = manager.createSession();
      expect(session.isAlive).toBe(true);

      manager.removeSession(session.id);

      // Wait a bit for async kill
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(session.isAlive).toBe(false);
    });

    it('should handle removing one session among multiple', () => {
      const session1 = manager.createSession();
      const session2 = manager.createSession();
      const session3 = manager.createSession();

      manager.removeSession(session2.id);

      expect(manager.listSessions()).toHaveLength(2);
      expect(manager.getSession(session1.id)).toBe(session1);
      expect(manager.getSession(session2.id)).toBeUndefined();
      expect(manager.getSession(session3.id)).toBe(session3);
    });
  });

  describe('listSessions', () => {
    it('should return empty array when no sessions', () => {
      const sessions = manager.listSessions();

      expect(sessions).toEqual([]);
    });

    it('should return all session IDs', () => {
      const session1 = manager.createSession();
      const session2 = manager.createSession();
      const session3 = manager.createSession();

      const sessions = manager.listSessions();

      expect(sessions).toHaveLength(3);
      expect(sessions).toContain(session1.id);
      expect(sessions).toContain(session2.id);
      expect(sessions).toContain(session3.id);
    });

    it('should update list after removing sessions', () => {
      const session1 = manager.createSession();
      const session2 = manager.createSession();

      expect(manager.listSessions()).toHaveLength(2);

      manager.removeSession(session1.id);

      const sessions = manager.listSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions).toContain(session2.id);
      expect(sessions).not.toContain(session1.id);
    });
  });

  describe('cleanup', () => {
    it('should remove all sessions', () => {
      manager.createSession();
      manager.createSession();
      manager.createSession();

      expect(manager.listSessions()).toHaveLength(3);

      manager.cleanup();

      expect(manager.listSessions()).toHaveLength(0);
    });

    it('should kill all sessions', async () => {
      const session1 = manager.createSession();
      const session2 = manager.createSession();
      const session3 = manager.createSession();

      manager.cleanup();

      // Wait for async cleanup
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(session1.isAlive).toBe(false);
      expect(session2.isAlive).toBe(false);
      expect(session3.isAlive).toBe(false);
    });

    it('should handle cleanup when no sessions exist', () => {
      expect(() => {
        manager.cleanup();
      }).not.toThrow();
    });

    it('should allow creating new sessions after cleanup', () => {
      manager.createSession();
      manager.createSession();
      manager.cleanup();

      const newSession = manager.createSession();

      expect(newSession).toBeDefined();
      expect(manager.listSessions()).toHaveLength(1);
    });
  });

  describe('error handling', () => {
    it('should handle session creation failure gracefully', () => {
      const options: TerminalSessionOptions = {
        shell: '/nonexistent/shell',
      };

      expect(() => {
        manager.createSession(options);
      }).toThrow();
    });

    it('should not affect other sessions when one fails', () => {
      const session1 = manager.createSession();

      try {
        manager.createSession({ shell: '/nonexistent/shell' });
      } catch {
        // Expected to fail
      }

      const session2 = manager.createSession();

      expect(manager.listSessions()).toHaveLength(2);
      expect(manager.getSession(session1.id)).toBe(session1);
      expect(manager.getSession(session2.id)).toBe(session2);
    });
  });

  describe('session lifecycle', () => {
    it('should automatically track session when created', () => {
      const session = manager.createSession();

      expect(manager.listSessions()).toContain(session.id);
    });

    it('should support concurrent session operations', async () => {
      // Create multiple sessions concurrently
      const sessions = await Promise.all([
        Promise.resolve(manager.createSession()),
        Promise.resolve(manager.createSession()),
        Promise.resolve(manager.createSession()),
      ]);

      expect(manager.listSessions()).toHaveLength(3);
      sessions.forEach((session) => {
        expect(manager.getSession(session.id)).toBe(session);
      });
    });
  });
});
