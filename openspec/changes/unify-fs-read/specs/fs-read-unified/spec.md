## ADDED Requirements

### Requirement: fs:read SHALL return content with contentType and encoding metadata

The `fs:read` socket event SHALL accept `{ path: string }` and return `{ content: string; contentType: string; encoding: 'utf-8' | 'base64' }` on success or `{ error: string }` on failure. The server SHALL determine encoding automatically based on file extension — binary extensions return base64-encoded content with `encoding: 'base64'`; all other files return UTF-8 content with `encoding: 'utf-8'`.

#### Scenario: Text file returns utf-8 content with contentType
- **WHEN** `fs:read` is called with `{ path: '/project/src/index.ts' }`
- **THEN** the response is `{ content: '<file text>', contentType: 'text/plain', encoding: 'utf-8' }`

#### Scenario: PDF file returns base64 content
- **WHEN** `fs:read` is called with `{ path: '/project/docs/report.pdf' }`
- **THEN** the response is `{ content: '<base64 string>', contentType: 'application/pdf', encoding: 'base64' }`

#### Scenario: Unknown extension returns utf-8 fallback
- **WHEN** `fs:read` is called with a file whose extension is not in the known binary list
- **THEN** the server reads it as UTF-8 and returns `encoding: 'utf-8'`

#### Scenario: Path outside allowed roots returns error
- **WHEN** `fs:read` is called with a path outside the server's allowed roots
- **THEN** the response is `{ error: 'Path outside allowed roots' }`

#### Scenario: Non-existent file returns error
- **WHEN** `fs:read` is called with a path that does not exist
- **THEN** the response is `{ error: '...' }`

### Requirement: fs:read-binary event SHALL be removed

The `fs:read-binary` socket event SHALL no longer exist. Any client calling it will receive no response.

#### Scenario: Legacy fs:read-binary is not registered
- **WHEN** the server initialises its socket handlers
- **THEN** no handler is registered for the `fs:read-binary` event
