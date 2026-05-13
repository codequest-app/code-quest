import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'release');

const PRESERVE = new Set(['runtime']);

function cleanDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!PRESERVE.has(entry.name)) {
      rmSync(resolve(dir, entry.name), { recursive: true, force: true });
    }
  }
}

cleanDir(`${dist}/server`);
cleanDir(`${dist}/summoner`);
mkdirSync(`${dist}/server`, { recursive: true });
mkdirSync(`${dist}/summoner`, { recursive: true });

// Server
cpSync(`${root}/apps/server/dist`, `${dist}/server`, { recursive: true });
rmSync(`${dist}/server/node_modules/better-sqlite3/build/Release/better_sqlite3.node`, {
  force: true,
});
cpSync(`${root}/apps/server/.env.example`, `${dist}/server/.env.example`);
cpSync(`${root}/apps/server/bin/server.sh`, `${dist}/server/server.sh`);
cpSync(`${root}/apps/server/bin/server.bat`, `${dist}/server/server.bat`);

// Summoner
cpSync(`${root}/apps/summoner/dist/main.js`, `${dist}/summoner/main.js`);
cpSync(`${root}/apps/summoner/.env.example`, `${dist}/summoner/.env.example`);
cpSync(`${root}/apps/summoner/bin/summoner.sh`, `${dist}/summoner/summoner.sh`);
cpSync(`${root}/apps/summoner/bin/summoner.bat`, `${dist}/summoner/summoner.bat`);

console.log('release/ ready:');
console.log('  release/server/');
console.log('  release/summoner/');
