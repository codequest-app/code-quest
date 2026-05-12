## ADDED Requirements

### Requirement: Testing Library query priority
Tests SHALL query elements using Testing Library APIs in priority order: `getByRole` > `getByLabelText` > `getByText` > `getByTestId`. Raw DOM methods (`container.querySelector`, `document.querySelector`) SHALL NOT be used when a Testing Library query exists.

#### Scenario: Role-based query
- **WHEN** an element has a semantic role (button, heading, list, etc.)
- **THEN** test uses `screen.getByRole('button', { name: /label/i })`

#### Scenario: Label-based query
- **WHEN** an element has an aria-label (decorative UI elements like timeline-dot)
- **THEN** test uses `screen.getByLabelText('timeline-dot')`

### Requirement: No CSS class or style assertions
Tests SHALL NOT assert on CSS class names, Tailwind utility classes, or inline styles. These are implementation details.

#### Scenario: Expandable open/closed state
- **WHEN** testing whether an Expandable is collapsed
- **THEN** test asserts `screen.getByRole('button', { name: /show more/i })` is in the document
- **WHEN** testing whether an Expandable is expanded
- **THEN** test asserts `screen.queryByRole('button', { name: /show more/i })` is NOT in the document

#### Scenario: Diff line type
- **WHEN** testing diff rendering
- **THEN** test uses `container.querySelector('[data-diff-type="added"]')` or `screen.getByText('+new line')`

#### Scenario: Spotlight highlight
- **WHEN** testing scrollToMessage highlight
- **THEN** test asserts `element.dataset.highlighted === 'true'` or `fireEvent('animationend')` then verifies removal

### Requirement: Store-aware components use FakeSummoner pipeline
Component tests that depend on Zustand store data SHALL use `renderWithChannel` + `claude.emitSegment` to populate state via the WebSocket pipeline, matching the production code path.

#### Scenario: CollapsibleTimeline with tool results
- **WHEN** testing CollapsibleTimeline dot colour after tool completion
- **THEN** test uses `renderWithChannel` + `emitSegment(s.toolUse(...))` + `emitSegment(s.toolResult(...))` to drive store state

#### Scenario: AssistantTurnContent with tool blocks
- **WHEN** testing AssistantTurnContent rendering tool-use blocks
- **THEN** test uses `renderWithChannel` + emit assistant turn segments

### Requirement: Third-party library internals are not tested
Tests SHALL NOT assert on CSS classes or DOM structure produced by third-party libraries (Prism, Radix UI, etc.).

#### Scenario: Syntax highlighting content
- **WHEN** testing Highlight component
- **THEN** test asserts the source code text is visible (`screen.getByText('const x = 1')`)
- **THEN** test does NOT assert on `[class*="language-bash"]` or similar Prism class names

### Requirement: Semantic attributes on testable UI elements
UI elements that carry meaningful state (expanded, highlighted, diff type) SHALL expose that state via `data-*` attributes or `aria-*` attributes, not only via CSS class names.

#### Scenario: Expandable data-expanded attribute
- **WHEN** Expandable is rendered
- **THEN** the inner content element has `data-expanded="true"` or `data-expanded="false"`

#### Scenario: Timeline decorative elements
- **WHEN** CollapsibleTimeline renders dot and line spans
- **THEN** dot span has `aria-label="timeline-dot"` and line span has `aria-label="timeline-line"`

#### Scenario: Diff line data attribute
- **WHEN** a unified diff is rendered
- **THEN** added lines have `data-diff-type="added"`, removed lines have `data-diff-type="removed"`

#### Scenario: Spotlight highlight attribute
- **WHEN** scrollToMessage highlights a message
- **THEN** the highlighted element has `data-highlighted="true"`
- **WHEN** animationend fires
- **THEN** `data-highlighted` attribute is removed
