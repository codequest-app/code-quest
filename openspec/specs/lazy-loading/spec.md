# lazy-loading Specification

## Purpose
TBD - created by archiving change code-splitting. Update Purpose after archive.
## Requirements
### Requirement: Conditionally rendered components are lazy-loaded
Components that are only shown on user action (dialogs, panels, menus) SHALL be loaded via React.lazy() and wrapped in Suspense with a minimal fallback.

#### Scenario: Dialog not opened
- **WHEN** user has not opened a dialog (e.g., ManageMcpDialog)
- **THEN** the dialog's code SHALL NOT be included in the initial bundle chunk

#### Scenario: Dialog opened for first time
- **WHEN** user opens a lazy-loaded dialog
- **THEN** the chunk SHALL be fetched on demand and the dialog SHALL render after loading

#### Scenario: Build produces multiple chunks
- **WHEN** the app is built for production
- **THEN** vite SHALL produce separate chunks for lazy-loaded components
- **AND** the initial chunk SHALL be smaller than the current 1,494 KB

### Requirement: No visual regression for lazy-loaded components
Lazy-loaded components SHALL render identically to their non-lazy counterparts. Suspense fallback SHALL be null or a minimal spinner to avoid layout shift.

#### Scenario: User opens dialog quickly
- **WHEN** user clicks to open a lazy dialog
- **THEN** there SHALL be no visible layout shift during loading

