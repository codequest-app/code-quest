## 1. Shared Schema & Events

- [x] 1.1 Update `fsReadResponseSchema` to include `contentType: string` and `encoding: z.enum(['utf-8', 'base64'])` fields
- [x] 1.2 Remove `fsReadBinaryPayloadSchema` and `fsReadBinaryResponseSchema` from `packages/shared/src/schemas/fs.ts`
- [x] 1.3 Remove `fs:read-binary` from `EVENTS` in `packages/shared/src/socket-events.ts`
- [x] 1.4 Remove `FsReadBinaryPayload` / `FsReadBinaryResponse` type exports

## 2. Summoner — FilesystemService

- [x] 2.1 Write failing tests for `readFileAbsolute` returning `contentType` + `encoding` (text and binary cases)
- [x] 2.2 Update `FilesystemService` interface: `readFileAbsolute` returns `{ content: string; contentType: string; encoding: 'utf-8' | 'base64' } | { error: string }`
- [x] 2.3 Implement binary extension map and MIME lookup in `local.ts`
- [x] 2.4 Update `readFileAbsolute` in `local.ts` to auto-detect encoding and return `contentType` + `encoding`
- [x] 2.5 Remove `readBinaryFileAbsolute` from interface and `local.ts`
- [x] 2.6 Update `fake-filesystem-service.ts` to match new interface

## 3. Server — Socket Handler

- [x] 3.1 Merge `handleReadBinary` logic into `handleRead` in `packages/server/src/socket/handlers/fs.ts`
- [x] 3.2 Remove `handleReadBinary` and its registration

## 4. Client — FilePreviewModal

- [x] 4.1 Write failing tests: `fs:read` response with `encoding: 'base64'` + `contentType: 'application/pdf'` renders PdfViewer
- [x] 4.2 Remove `fs:read-binary` RPC call from `FilePreviewModal`
- [x] 4.3 Replace `isPdf()` extension check with `encoding === 'base64' && contentType === 'application/pdf'` branch
- [x] 4.4 Update state union type to use unified response shape
- [x] 4.5 Verify all existing FilePreviewModal tests still pass

## 5. Cleanup & Full Suite

- [x] 5.1 Remove `fsReadBinaryResponseSchema` import from `FilePreviewModal`
- [x] 5.2 Run full test suite and fix any regressions
