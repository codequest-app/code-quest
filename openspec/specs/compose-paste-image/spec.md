# compose-paste-image

### Requirement: Paste clipboard image into compose attachments
The compose textarea SHALL accept image-type clipboard payloads pasted via the native paste shortcut (Cmd/Ctrl+V) and forward them as attachments through the existing `compose.addAttachments` channel API.

#### Scenario: Single image pasted
- **WHEN** the textarea is focused and the user pastes a clipboard containing one `image/png` (or any `image/*`) item
- **THEN** the pasted image file is appended to `attachedFiles` via `addAttachments`, the attachment chip appears in the compose toolbar, and the textarea value does not receive any binary-as-text content

#### Scenario: Multiple images pasted
- **WHEN** the user pastes a clipboard containing more than one `image/*` item
- **THEN** every image file is appended in clipboard order and the textarea value is unchanged

#### Scenario: Mixed paste (text only, no image)
- **WHEN** the user pastes a clipboard containing only text
- **THEN** the paste proceeds with default browser behavior (text inserted at the cursor), `addAttachments` is not called, and no image appears in the attachment list

#### Scenario: Mixed paste (image + text)
- **WHEN** the clipboard contains both an `image/*` item and a text item
- **THEN** the image is attached AND the default paste is prevented so the textarea does not also receive the image's textual representation; text-only content that accompanies an image is ignored in this release

#### Scenario: Unsupported clipboard payload
- **WHEN** the clipboard contains only non-image, non-text items (e.g. `application/*`)
- **THEN** the handler does not call `addAttachments`, does not preventDefault, and lets default browser behavior apply
