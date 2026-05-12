## ADDED Requirements

### Requirement: Image thumbnail in compose input

#### Scenario: Paste image shows thumbnail
- **WHEN** user pastes an image into the compose input
- **THEN** a thumbnail preview appears above the input
- **AND** thumbnail shows the actual image content (not just filename)

#### Scenario: Click thumbnail opens preview
- **WHEN** user clicks a pasted image thumbnail
- **THEN** a modal opens showing the full-size image

#### Scenario: Remove pasted image
- **WHEN** user clicks the remove button on a thumbnail
- **THEN** the image is removed from attachments
- **AND** the thumbnail disappears

### Requirement: Image rendering in message list

#### Scenario: Sent message shows inline image
- **WHEN** a user message with image attachment is displayed
- **THEN** the image renders as an `<img>` element (not base64 text)

#### Scenario: Click message image opens preview
- **WHEN** user clicks an image in the message list
- **THEN** a modal opens showing the full-size image

### Requirement: ImagePreviewModal

#### Scenario: Modal displays image
- **WHEN** ImagePreviewModal is opened with a src
- **THEN** the full-size image is displayed in a centered overlay

#### Scenario: Close modal
- **WHEN** user presses ESC or clicks the overlay background
- **THEN** the modal closes
