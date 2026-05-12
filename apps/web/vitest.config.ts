import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  assetsInclude: ['**/*.mjs'],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/test/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/__tests__/',
        '**/types/',
        'src/main.tsx',
        'vite.config.ts',
        'vitest.config.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    onUnhandledError(error) {
      // happy-dom aborts in-flight fetch requests during environment teardown.
      // This is a known happy-dom behaviour, not a test or application bug.
      if (error instanceof DOMException && error.name === 'AbortError') return 'skip';
    },
    pool: 'threads',
    passWithNoTests: false,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
  },
});
