## Why

`fs:read` and `fs:read-binary` are two separate socket events with inconsistent response shapes (`content` vs `data`) doing the same job — reading a file. The split forces callers to know ahead of time whether a file is binary, duplicates server-side path validation logic, and makes the protocol harder to extend (e.g. adding images would require a third event).

## What Changes

- **BREAKING** Merge `fs:read-binary` into `fs:read`: the single event now returns `{ content: string; contentType: string; encoding: 'utf-8' | 'base64' }` or `{ error: string }`
- **BREAKING** Remove `fs:read-binary` socket event and its schema
- Server detects MIME type from file extension and decides encoding automatically; callers no longer pass a `binary` flag
- `FilePreviewModal` drops `isPdf()` / extension-sniffing; branches on `encoding === 'base64'` and `contentType` instead
- `FilesystemService` interface gains `readFileAbsolute` returning the unified response (replaces `readBinaryFileAbsolute`)

## Capabilities

### New Capabilities

- `fs-read-unified`: Single `fs:read` event that returns content with `contentType` and `encoding` metadata; server auto-detects binary vs text by extension

### Modified Capabilities

- `filesystem-service`: `readBinaryFileAbsolute` is removed; `readFileAbsolute` is extended to return `contentType` and `encoding` alongside `content`
- `files-pane`: `FilePreviewModal` branches on `encoding`/`contentType` instead of file extension

## Impact

- `packages/shared`: remove `fsReadBinaryPayloadSchema` / `fsReadBinaryResponseSchema`, update `fsReadResponseSchema`, remove `fs:read-binary` from `EVENTS`
- `packages/summoner`: remove `readBinaryFileAbsolute` from interface + implementations; update `readFileAbsolute` return type
- `packages/server`: merge `handleReadBinary` into `handleRead`; remove binary handler registration
- `packages/client`: update `FilePreviewModal` to use unified response; remove `fs:read-binary` call
