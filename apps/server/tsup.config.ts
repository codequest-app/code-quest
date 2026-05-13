import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { defineConfig } from 'tsup';

const require = createRequire(import.meta.url);

export default defineConfig({
  entry: ['src/bin/server.ts', 'src/scripts/migrate-sqlite.ts', 'src/scripts/migrate-mysql.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  clean: false,
  splitting: false,
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

    const betterSqlite3Dir = dirname(require.resolve('better-sqlite3/package.json'));

    if (!existsSync(resolve(betterSqlite3Dir, 'build/Release/better_sqlite3.node'))) {
      execFileSync('npx', ['--yes', 'prebuild-install'], {
        cwd: betterSqlite3Dir,
        stdio: 'inherit',
        shell: process.platform === 'win32',
      });
    }

    const betterSqlite3Require = createRequire(require.resolve('better-sqlite3/package.json'));
    const copyDep = (name: string) => {
      const dir = dirname(betterSqlite3Require.resolve(`${name}/package.json`));
      cpSync(dir, resolve(`dist/node_modules/${name}`), { recursive: true });
    };

    for (const sub of ['lib', 'build', 'package.json', 'LICENSE']) {
      cpSync(resolve(betterSqlite3Dir, sub), resolve(`dist/node_modules/better-sqlite3/${sub}`), {
        recursive: true,
      });
    }
    copyDep('bindings');
    copyDep('file-uri-to-path');

    const webDist = resolve('../../apps/web/dist');
    if (existsSync(join(webDist, 'index.html'))) {
      cpSync(webDist, resolve('dist/public'), { recursive: true });
    }

    const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'));
    writeFileSync(
      resolve('dist/package.json'),
      JSON.stringify({ name: pkg.name, version: pkg.version, type: 'module' }, null, 2),
    );
  },
});
