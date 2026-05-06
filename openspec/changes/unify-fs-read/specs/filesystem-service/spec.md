## MODIFIED Requirements

### Requirement: readFileAbsolute SHALL return content with contentType and encoding metadata

`readFileAbsolute(absolutePath: string)` SHALL return `Promise<{ content: string; contentType: string; encoding: 'utf-8' | 'base64' } | { error: string }>`. The implementation SHALL detect binary files by extension and return base64-encoded content with `encoding: 'base64'`; all other files SHALL be read as UTF-8 with `encoding: 'utf-8'`.

#### Scenario: Text file returns utf-8 content with metadata
- **WHEN** `await readFileAbsolute('/project/src/app.ts')` is called and the file exists
- **THEN** it resolves with `{ content: '<text>', contentType: 'text/plain', encoding: 'utf-8' }`

#### Scenario: PDF file returns base64 content with metadata
- **WHEN** `await readFileAbsolute('/project/report.pdf')` is called and the file exists
- **THEN** it resolves with `{ content: '<base64>', contentType: 'application/pdf', encoding: 'base64' }`

#### Scenario: Path outside allowed roots returns error
- **WHEN** `await readFileAbsolute('/etc/passwd')` is called and `/etc` is not under any root
- **THEN** it resolves with `{ error: 'Path outside allowed roots' }`

#### Scenario: Non-existent file returns error
- **WHEN** `await readFileAbsolute('/project/missing.ts')` is called
- **THEN** it resolves with `{ error: '...' }`

## REMOVED Requirements

### Requirement: readBinaryFileAbsolute SHALL read binary file as base64

**Reason**: Replaced by unified `readFileAbsolute` which auto-detects encoding.
**Migration**: Use `readFileAbsolute`; check `encoding === 'base64'` in the response.
