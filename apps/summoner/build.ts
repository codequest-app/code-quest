import { readFileSync, writeFileSync } from 'node:fs';
import JavaScriptObfuscator from 'javascript-obfuscator';

const result = await Bun.build({
  entrypoints: ['src/main.ts'],
  outdir: 'dist',
  target: 'bun',
  minify: true,
});

if (!result.success) {
  console.error('Build failed:');
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

const bundlePath = 'dist/main.js';
const code = readFileSync(bundlePath, 'utf-8');

const obfuscated = JavaScriptObfuscator.obfuscate(code, {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  stringArray: true,
  stringArrayEncoding: ['rc4'],
  stringArrayThreshold: 0.5,
});

writeFileSync(bundlePath, obfuscated.getObfuscatedCode());
console.log('Bundle + obfuscation complete');
