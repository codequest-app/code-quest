## ADDED Requirements

### Requirement: ChatPanel renders Header slot content
`ChatPanel` SHALL render any children passed via `ChatPanel.Header` in the header position of the layout.

#### Scenario: Header slot renders its children
- **WHEN** `ChatPanel` is rendered with `<ChatPanel.Header><div>My Header</div></ChatPanel.Header>`
- **THEN** the text "My Header" SHALL be present in the document

### Requirement: ChatPanel renders Body slot content
`ChatPanel` SHALL render any children passed via `ChatPanel.Body` in the scrollable body area.

#### Scenario: Body slot renders its children
- **WHEN** `ChatPanel` is rendered with `<ChatPanel.Body><div>Message List</div></ChatPanel.Body>`
- **THEN** the text "Message List" SHALL be present in the document

### Requirement: ChatPanel renders Footer slot content
`ChatPanel` SHALL render any children passed via `ChatPanel.Footer` in the sticky footer area.

#### Scenario: Footer slot renders its children
- **WHEN** `ChatPanel` is rendered with `<ChatPanel.Footer><div>Compose</div></ChatPanel.Footer>`
- **THEN** the text "Compose" SHALL be present in the document

### Requirement: ChatPanel renders Side slot content
`ChatPanel` SHALL render any children passed via `ChatPanel.Side` as a side panel alongside the main chat column.

#### Scenario: Side slot renders when provided
- **WHEN** `ChatPanel` is rendered with `<ChatPanel.Side><div>Side Panel</div></ChatPanel.Side>`
- **THEN** the text "Side Panel" SHALL be present in the document

#### Scenario: Side slot is absent when not provided
- **WHEN** `ChatPanel` is rendered without a `ChatPanel.Side` child
- **THEN** no side panel container SHALL be rendered

### Requirement: ChatPanel omits empty slots
`ChatPanel` SHALL NOT render slot containers for slots that have no children provided.

#### Scenario: No children renders minimal layout
- **WHEN** `ChatPanel` is rendered with no children
- **THEN** the component SHALL render without error
