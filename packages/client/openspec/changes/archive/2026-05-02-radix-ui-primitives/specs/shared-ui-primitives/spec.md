## ADDED Requirements

### Requirement: Checkbox primitive added to ui/ directory
A `ui/Checkbox` component SHALL exist in `packages/client/src/components/ui/Checkbox.tsx`, wrapping `@radix-ui/react-checkbox` with the project's visual style.

#### Scenario: Checkbox renders with label
- **WHEN** `<Checkbox checked={true} onCheckedChange={fn}>Label</Checkbox>` is rendered
- **THEN** a visible checkbox indicator and label text SHALL appear

#### Scenario: Checkbox accessible
- **WHEN** the checkbox is rendered
- **THEN** it SHALL have correct ARIA role and checked state via the Radix primitive
