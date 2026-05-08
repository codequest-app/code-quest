import { execFileSync } from 'node:child_process';
import { cpSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/bin/server.ts', 'src/scripts/migrate-sqlite.ts', 'src/scripts/migrate-mysql.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  clean: false,
  splitting: true,
  sourcemap: false,
  noExternal: [/@code-quest\/.*/],
  external: ['better-sqlite3'],
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
  onSuccess() {
    cpSync(resolve('../../packages/db-schema/drizzle'), resolve('dist/migrations'), {
      recursive: true,
    });

    const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'));
    const {
      '@code-quest/shared': _,
      '@code-quest/db-schema': _2,
      '@code-quest/summoner': _3,
      ...deps
    } = pkg.dependencies;
    const prodPkg = { name: pkg.name, version: pkg.version, type: 'module', dependencies: deps };
    writeFileSync(resolve('dist/package.json'), JSON.stringify(prodPkg, null, 2));
    execFileSync('npm', ['install', '--omit=dev'], { cwd: resolve('dist'), stdio: 'inherit' });
  },
});
