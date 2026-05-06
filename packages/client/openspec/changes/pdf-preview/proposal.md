## Why

The right-side Files panel can preview text files, markdown, and code, but clicking a `.pdf` file produces garbled binary text. PDF is a common file type in any project and users need to be able to view it without leaving the app.

## What Changes

- Add a new `fs:read-binary` RPC (server-side) that returns file content as base64
- Add `react-pdf` (PDF.js-based) to the client package
- `FilePreviewModal` detects `.pdf` extension and renders the PDF using `react-pdf` `<Document>/<Page>` with prev/next page controls
- `getFileIcon` maps `pdf` extension to an appropriate icon
- Vite config updated to copy the PDF.js worker asset

## Capabilities

### New Capabilities

- `pdf-file-preview`: Render PDF files inside `FilePreviewModal` using react-pdf, with page navigation and the existing Mention / Copy path footer actions

### Modified Capabilities

## Impact

- **New dependency**: `react-pdf` (client), `pdfjs-dist` (peer, bundled by react-pdf)
- **Server**: new `fs:read-binary` socket event + schema in `@code-quest/shared`
- **Client**: `FilePreviewModal`, `getFileIcon`, `vite.config.ts`
- **Tests**: `FilePreviewModal.test.tsx` needs PDF branch coverage; `react-pdf` must be mocked in vitest
