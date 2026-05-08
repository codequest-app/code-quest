import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/bin/server.ts', 'src/scripts/migrate-sqlite.ts', 'src/scripts/migrate-mysql.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  clean: true,
  splitting: true,
  sourcemap: false,
  noExternal: [/@code-quest\/.*/],
  external: ['better-sqlite3'],
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
});
