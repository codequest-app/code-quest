import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import JavaScriptObfuscator from 'javascript-obfuscator';

type ObfuscationLevel = 'none' | 'low' | 'medium' | 'high';

const levels: Record<ObfuscationLevel, object> = {
  none: {},
  low: {
    target: 'node',
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.5,
    stringArray: true,
    stringArrayThreshold: 0.5,
  },
  medium: {
    target: 'node',
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    stringArray: true,
    stringArrayThreshold: 0.75,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    splitStrings: true,
    splitStringsChunkLength: 5,
    identifierNamesGenerator: 'hexadecimal',
    selfDefending: true,
    transformObjectKeys: true,
  },
  get high() {
    return {
      ...this.medium,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.4,
    };
  },
};

function getObfuscationOptions(
  envLevel?: string,
  defaultLevel: ObfuscationLevel = 'high',
): { level: ObfuscationLevel; options: object } {
  const level = (envLevel && envLevel in levels ? envLevel : defaultLevel) as ObfuscationLevel;
  return { level, options: levels[level] };
}

const { level, options } = getObfuscationOptions(process.env.OBFUSCATE_LEVEL, 'high');

if (level === 'none') {
  console.log('Obfuscation skipped (level: none)');
  process.exit(0);
}

const distDir = 'dist';
const jsFiles = readdirSync(distDir, { recursive: true }).filter(
  (f): f is string =>
    typeof f === 'string' &&
    f.endsWith('.js') &&
    !f.includes('node_modules') &&
    !f.includes('public') &&
    !f.includes('_chunks'),
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
