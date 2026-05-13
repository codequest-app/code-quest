import { readFileSync, writeFileSync } from 'node:fs';
import JavaScriptObfuscator from 'javascript-obfuscator';

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
console.log('Obfuscation complete');
