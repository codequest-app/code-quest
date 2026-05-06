## 1. Dependencies & Shared Schema

- [x] 1.1 Add `react-pdf` to `packages/client` dependencies
- [x] 1.2 Add `fs:read-binary` event + `fsReadBinaryResponseSchema` to `@code-quest/shared` (request: `{ path }`, response: `{ data: string }` base64 or `{ error: string }`)

## 2. Server

- [x] 2.1 Implement `fs:read-binary` socket handler — read file with `fs.readFile`, return base64-encoded content
- [x] 2.2 Register the handler in the socket router

## 3. Client — PdfViewer component (TDD)

- [x] 3.1 Write failing tests for `PdfViewer`: loading state, page render, prev/next navigation, disabled states, error state
- [x] 3.2 Implement `PdfViewer` component with `react-pdf` `<Document>/<Page>`, page counter, prev/next buttons
- [x] 3.3 Set up PDF.js worker via `pdfjs-dist/build/pdf.worker.min.mjs?url` in the component file

## 4. Client — FilePreviewModal integration (TDD)

- [x] 4.1 Write failing test: opening a `.pdf` path shows PDF viewer (mock `PdfViewer`)
- [x] 4.2 Wire `FilePreviewModal` to detect `.pdf` extension, call `fs:read-binary`, and render lazy-loaded `PdfViewer`
- [x] 4.3 Write failing test: `fs:read-binary` error shows error message in PDF branch
- [x] 4.4 Implement error handling for binary fetch in `FilePreviewModal`

## 5. Polish

- [x] 5.1 Add `pdf` → `material-icon-theme:pdf` mapping in `getFileIcon`
- [x] 5.2 Run full test suite, fix any regressions
