import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import JavaScriptObfuscator from 'javascript-obfuscator';
import { getObfuscationOptions } from './src/obfuscation-config.ts';

const { level, options } = getObfuscationOptions(process.env.OBFUSCATE_LEVEL, 'high');

if (level === 'none') {
  console.log('Obfuscation skipped (level: none)');
  process.exit(0);
}

const distDir = 'dist';
const jsFiles = readdirSync(distDir, { recursive: true }).filter(
  (f): f is string => typeof f === 'string' && f.endsWith('.js') && !f.includes('node_modules'),
);

// encodeURIComponent (used by javascript-obfuscator's btoa) throws URIError on
// lone surrogates (\uD800-\uDFFF without a pair). Sanitize before obfuscating.
function sanitizeLoneSurrogates(code: string): string {
  return code.replace(/[\uD800-\uDFFF]/g, (ch) => {
    return `\\u${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
  });
}

for (const file of jsFiles) {
  const filePath = join(distDir, file);
  const code = sanitizeLoneSurrogates(readFileSync(filePath, 'utf-8'));
  const obfuscated = JavaScriptObfuscator.obfuscate(code, options);
  writeFileSync(filePath, obfuscated.getObfuscatedCode());
  console.log(`✓ ${filePath}`);
}

console.log(`Obfuscation complete (level: ${level})`);
