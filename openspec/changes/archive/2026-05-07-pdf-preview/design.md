## Context

`FilePreviewModal` reads files via the existing `fs:read` RPC, which returns UTF-8 text. PDF is binary; reading it as UTF-8 produces garbled output. `react-pdf` (wrapping PDF.js) can render PDFs from a `Uint8Array` or `ArrayBuffer` in-browser, so the key requirement is a way to get binary content from the server to the client.

## Goals / Non-Goals

**Goals:**
- Render PDF pages inside `FilePreviewModal` with prev/next navigation
- Reuse the existing Mention / Copy path footer
- Keep the new binary RPC minimal and purpose-built

**Non-Goals:**
- Full-text search inside PDFs
- Annotation or editing
- Serving PDFs over HTTP (avoids opening a new HTTP endpoint)
- Supporting other binary formats (images already handled separately)

## Decisions

### 1. `fs:read-binary` RPC over extending `fs:read`

`fs:read` returns `{ content: string }`. Adding an optional `encoding: 'base64'` flag would complicate the response schema and all existing consumers. A dedicated `fs:read-binary` event with `{ data: string }` (base64) keeps the two paths independent and the shared schema clean.

*Alternative rejected*: HTTP file-serve endpoint — requires auth plumbing, opens a new attack surface, and is harder to sandbox to the project `cwd`.

### 2. `react-pdf` over raw PDF.js

`react-pdf` provides React components (`<Document>`, `<Page>`) that manage PDF.js lifecycle. Raw PDF.js would require manual canvas management. `react-pdf` v9 targets PDF.js 4.x and ships its own worker bundle.

*Alternative rejected*: `pdfjs-dist` directly — more boilerplate, no benefit here.

### 3. Worker delivered via Vite `?url` import

`react-pdf` requires the PDF.js worker URL to be set before rendering. In Vite we import `pdfjs-dist/build/pdf.worker.min.mjs?url` and pass it to `pdfjs.GlobalWorkerOptions.workerSrc`. This is done once at module load in a `PdfViewer` component file, keeping the side-effect isolated.

*Alternative rejected*: CDN worker URL — breaks offline / intranet environments.

### 4. Lazy-load `PdfViewer` via `React.lazy`

PDF.js is ~1 MB. The viewer is only needed when a PDF is opened. `React.lazy` + `Suspense` keeps it out of the initial bundle.

## Risks / Trade-offs

- **PDF.js worker Vite quirk** → The `?url` import must be in a file processed by Vite (not a `.ts` test file). Tests mock `react-pdf` entirely so the worker is never instantiated in vitest.
- **Large PDFs** → PDF.js renders one page at a time; memory is bounded. No page limit enforced — pathological files (10,000 pages) could make navigation slow. Acceptable for a file browser tool.
- **base64 overhead** → A 5 MB PDF becomes ~6.7 MB over the socket. Acceptable for occasional preview use.

## Migration Plan

No migration needed — purely additive. The new `fs:read-binary` event is ignored by old clients.
