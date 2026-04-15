/**
 * Check for deprecated API usage (ts6385) using TypeScript Compiler API.
 * Runs getSuggestionDiagnostics() which tsc --noEmit does NOT expose.
 *
 * Usage: node scripts/check-deprecated.mjs <tsconfig-path> [files...]
 *   If files are provided, only those files are checked.
 *   Otherwise all files in the tsconfig are checked.
 */

import ts from 'typescript';
import path from 'node:path';
import fs from 'node:fs';

const DEPRECATED_CODE = 6385;

const [, , tsconfigArg, ...fileArgs] = process.argv;

if (!tsconfigArg) {
  console.error('Usage: node scripts/check-deprecated.mjs <tsconfig-path> [files...]');
  process.exit(2);
}

const tsconfigPath = path.resolve(tsconfigArg);
if (!fs.existsSync(tsconfigPath)) {
  console.error(`tsconfig not found: ${tsconfigPath}`);
  process.exit(2);
}

const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
if (configFile.error) {
  console.error(ts.formatDiagnostic(configFile.error, ts.createCompilerHost({})));
  process.exit(2);
}

const parsedConfig = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  path.dirname(tsconfigPath),
);

const filesToCheck = fileArgs.length > 0
  ? fileArgs.map((f) => path.resolve(f))
  : parsedConfig.fileNames;

const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
const checker = program.getTypeChecker();

let errorCount = 0;

for (const filePath of filesToCheck) {
  const sourceFile = program.getSourceFile(filePath);
  if (!sourceFile) continue;

  const diags = program.getSuggestionDiagnostics(sourceFile);
  const deprecated = diags.filter((d) => d.code === DEPRECATED_CODE);

  for (const diag of deprecated) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(diag.start ?? 0);
    const rel = path.relative(process.cwd(), filePath);
    const msg = typeof diag.messageText === 'string'
      ? diag.messageText
      : diag.messageText.messageText;
    console.error(`${rel}:${line + 1}:${character + 1} — ${msg}`);
    errorCount++;
  }
}

if (errorCount > 0) {
  console.error(`\n${errorCount} deprecated usage(s) found.`);
  process.exit(1);
}
