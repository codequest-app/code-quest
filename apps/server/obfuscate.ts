import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import JavaScriptObfuscator from 'javascript-obfuscator';

const distDir = 'dist';
const jsFiles = readdirSync(distDir, { recursive: true }).filter(
  (f): f is string => typeof f === 'string' && f.endsWith('.js') && !f.includes('node_modules'),
);

for (const file of jsFiles) {
  const filePath = join(distDir, file);
  const code = readFileSync(filePath, 'utf-8');
  const obfuscated = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.5,
    stringArray: true,
    stringArrayEncoding: ['rc4'],
    stringArrayThreshold: 0.5,
  });
  writeFileSync(filePath, obfuscated.getObfuscatedCode());
  console.log(`✓ ${filePath}`);
}

console.log('Obfuscation complete');
