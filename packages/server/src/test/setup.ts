import 'reflect-metadata';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Mock node-pty globally
vi.mock('node-pty', async () => {
  const mockModule = await import('./__mocks__/node-pty.ts');
  return mockModule;
});

// MSW setup will be here if needed for HTTP mocking
// For now, we'll use vi.mock for Socket.io and node-pty

beforeAll(() => {
  // Setup code before all tests
  console.log('Setting up tests...');
});

afterEach(() => {
  // Cleanup after each test
  // Clear all mocks
});

afterAll(() => {
  // Cleanup after all tests
  console.log('Cleaning up tests...');
});
