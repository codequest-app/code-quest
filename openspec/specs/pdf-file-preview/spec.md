## ADDED Requirements

### Requirement: PDF files render inside FilePreviewModal
When the user opens a `.pdf` file from the Files panel, the system SHALL display the PDF content using a page-based viewer instead of attempting to render it as text.

#### Scenario: PDF file opens viewer
- **WHEN** user clicks a `.pdf` file in the Files panel
- **THEN** `FilePreviewModal` shows a PDF viewer with the first page rendered

#### Scenario: Non-PDF files unaffected
- **WHEN** user clicks a non-PDF file (e.g. `.ts`, `.md`)
- **THEN** `FilePreviewModal` renders the existing text/code/markdown preview

### Requirement: PDF viewer provides page navigation
The PDF viewer SHALL display the current page number and total page count, and provide previous/next controls to navigate between pages.

#### Scenario: Navigate to next page
- **WHEN** user clicks the next-page button and the current page is not the last page
- **THEN** the viewer advances to the next page and updates the page counter

#### Scenario: Navigate to previous page
- **WHEN** user clicks the previous-page button and the current page is not the first page
- **THEN** the viewer goes back one page and updates the page counter

#### Scenario: Previous button disabled on first page
- **WHEN** the current page is the first page
- **THEN** the previous-page button is disabled

#### Scenario: Next button disabled on last page
- **WHEN** the current page is the last page
- **THEN** the next-page button is disabled

### Requirement: PDF viewer shows loading state
The system SHALL display a loading indicator while the PDF binary is being fetched and while PDF.js is parsing the document.

#### Scenario: Loading indicator shown during fetch
- **WHEN** a PDF file is opened and the binary data has not yet arrived
- **THEN** the modal body shows a loading indicator

### Requirement: PDF fetch errors are surfaced
If the server returns an error for `fs:read-binary`, the system SHALL display the error message in place of the viewer.

#### Scenario: Read error displayed
- **WHEN** `fs:read-binary` responds with an error
- **THEN** the modal body shows the error message

### Requirement: Mention and Copy path actions work for PDF files
The existing footer buttons (Mention, Copy path, Close) SHALL be present and functional when viewing a PDF file.

#### Scenario: Mention action from PDF preview
- **WHEN** user clicks Mention while viewing a PDF
- **THEN** the `onMention` callback is called with the PDF file path
