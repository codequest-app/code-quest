import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  clean: false,
  splitting: false,
  minify: true,
  noExternal: [/^(?!better-sqlite3).*/],
});
