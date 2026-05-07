## Context

Currently there are two socket events for reading files:
- `fs:read` → returns `{ content: string }` (UTF-8 text)
- `fs:read-binary` → returns `{ data: string }` (base64)

The split was introduced ad-hoc when PDF support was added. Callers must know in advance whether a file is binary, the response field names are inconsistent (`content` vs `data`), and the server duplicates path validation logic across two handlers.

## Goals / Non-Goals

**Goals:**
- Single `fs:read` event that handles both text and binary files
- Server auto-detects encoding from file extension; callers never pass a `binary` flag
- Consistent response shape: `{ content: string; contentType: string; encoding: 'utf-8' | 'base64' }`
- `FilePreviewModal` branches on `encoding`/`contentType` instead of file extension sniffing

**Non-Goals:**
- Magic-byte MIME detection (extension-based lookup is sufficient for known file types)
- Streaming large files
- Supporting arbitrary encodings beyond utf-8 and base64

## Decisions

### Decision: Server decides encoding, not the caller

**Chosen:** Server inspects the file extension and picks `utf-8` for text files, `base64` for binary files.

**Alternative considered:** Add `binary?: boolean` request param. Rejected because it leaks the decision to callers — `FilePreviewModal` would still need extension-sniffing logic to know when to set `binary: true`, which is exactly the coupling we want to eliminate.

### Decision: Unified field name `content` for both encodings

**Chosen:** Response always uses `content` regardless of encoding. `encoding` field tells the client how to interpret it.

**Alternative considered:** Keep separate field names (`content` for text, `data` for binary). Rejected because it requires callers to branch on field presence before they can even read the value.

### Decision: Extension-based MIME type list in server handler

**Chosen:** Maintain a small hardcoded map of binary extensions (`pdf`, `png`, `jpg`, `jpeg`, `gif`, `webp`, `ico`, `woff`, `woff2`, `ttf`, `eot`, `otf`, `zip`, `gz`, `tar`). Everything else is treated as UTF-8.

**Alternative considered:** Use a mime-type npm package. Rejected — adds a dependency for a small, stable lookup table.

### Decision: Remove `readBinaryFileAbsolute` from FilesystemService

**Chosen:** Extend `readFileAbsolute` to return `{ content: string; contentType: string; encoding: 'utf-8' | 'base64' } | { error: string }`. Remove `readBinaryFileAbsolute`.

**Alternative:** Keep both methods. Rejected — defeats the unification goal.

## Risks / Trade-offs

- [Risk] Files with unusual or missing extensions default to UTF-8 and may garble binary content → Mitigation: conservative binary extension list errs toward known types; unknown files falling back to UTF-8 is acceptable for the current use case (PDF and images are the only binary types needed)
- [Risk] Existing tests for `fs:read-binary` become dead code after removal → Mitigation: delete alongside the event

## Migration Plan

1. Update `@code-quest/shared`: merge schemas, update `EVENTS`
2. Update `apps/summoner`: merge filesystem interface + implementations
3. Update `apps/server`: merge handlers
4. Update `apps/web`: update `FilePreviewModal` to use unified response
5. No external clients to migrate (internal socket protocol only)
