import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/bin/server.ts', 'src/scripts/migrate-sqlite.ts', 'src/scripts/migrate-mysql.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  clean: false,
  splitting: true,
  sourcemap: process.env.BUILD_SOURCEMAP === 'true',
  noExternal: [/^(?!better-sqlite3|bindings|file-uri-to-path).*/],
  external: ['better-sqlite3', 'bindings', 'file-uri-to-path'],
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
  onSuccess() {
    cpSync(resolve('../../packages/db-schema/drizzle'), resolve('dist/migrations'), {
      recursive: true,
    });

    const nativeSource = resolve('node_modules/better-sqlite3/build/Release/better_sqlite3.node');
    const nativeTarget = resolve('dist/build/Release/better_sqlite3.node');
    mkdirSync(resolve('dist/build/Release'), { recursive: true });
    cpSync(nativeSource, nativeTarget);

    const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'));
    writeFileSync(
      resolve('dist/package.json'),
      JSON.stringify({ name: pkg.name, version: pkg.version, type: 'module' }, null, 2),
    );
  },
});
