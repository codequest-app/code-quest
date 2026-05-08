import { cpSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'tsup';

const require = createRequire(import.meta.url);

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

    const betterSqlite3Require = createRequire(require.resolve('better-sqlite3/package.json'));
    const copyDep = (name: string, req = betterSqlite3Require) => {
      const dir = dirname(req.resolve(`${name}/package.json`));
      cpSync(dir, resolve(`dist/node_modules/${name}`), { recursive: true });
    };

    copyDep('better-sqlite3', require);
    copyDep('bindings');
    copyDep('file-uri-to-path');

    const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'));
    writeFileSync(
      resolve('dist/package.json'),
      JSON.stringify({ name: pkg.name, version: pkg.version, type: 'module' }, null, 2),
    );
  },
});
