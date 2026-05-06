## MODIFIED Requirements

### Requirement: File preview modal

`<FilePreviewModal>` SHALL render a modal with syntax-highlighted content plus a Mention-in-chat action and a Copy-path action. Files above 500 KB render a "File too large" fallback. The modal SHALL use the unified `fs:read` event and branch on `encoding` and `contentType` from the response — it SHALL NOT sniff the file extension to determine rendering mode.

#### Scenario: Small text file renders highlighted content
- **WHEN** `<FilePreviewModal path="src/index.ts" />` opens for a small file
- **THEN** content is fetched via `fs:read`, the response has `encoding: 'utf-8'`, and content is rendered with syntax highlighting

#### Scenario: PDF file renders PdfViewer
- **WHEN** `<FilePreviewModal path="report.pdf" />` opens and `fs:read` returns `encoding: 'base64'` and `contentType: 'application/pdf'`
- **THEN** `<PdfViewer data={content} />` is rendered with the base64 content

#### Scenario: Large file renders fallback
- **WHEN** the target file exceeds 500 KB
- **THEN** the body shows "File too large to preview" with a Copy-path action; no content is rendered

#### Scenario: Mention button invokes existing mention flow
- **WHEN** the user clicks the "Mention in chat" button
- **THEN** the mention-file feature is invoked with the file's path and the modal closes

#### Scenario: Error from fs:read shows error message
- **WHEN** `fs:read` returns `{ error: '...' }`
- **THEN** the modal body shows the error message
