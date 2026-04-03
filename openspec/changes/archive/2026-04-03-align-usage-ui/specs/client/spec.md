## MODIFIED Requirements

### Requirement: UsageBar color thresholds
UsageBar SHALL use two-state coloring: `bg-accent` for normal utilization and `bg-danger` when utilization >= 80%. The previous three-state (success/warning/danger at 50%/80%) coloring SHALL be removed.

#### Scenario: Low utilization shows accent color
- **WHEN** utilization is 0.3 (30%)
- **THEN** the bar uses `bg-accent` class

#### Scenario: Medium utilization still shows accent color
- **WHEN** utilization is 0.6 (60%)
- **THEN** the bar uses `bg-accent` class (NOT warning)

#### Scenario: High utilization shows danger color
- **WHEN** utilization is 0.9 (90%)
- **THEN** the bar uses `bg-danger` class

### Requirement: UsageBar reset time format
UsageBar SHALL display reset times in relative format (`in Xm`, `in Xh`, `in Xd`) instead of absolute time. The `formatResetTime` function SHALL be shared between UsageBar and AccountUsageDialog.

#### Scenario: Reset time within the hour
- **WHEN** resets_at is 45 minutes from now
- **THEN** display shows "resets in 45m"

#### Scenario: Reset time in hours
- **WHEN** resets_at is 3 hours from now
- **THEN** display shows "resets in 3h"

#### Scenario: Reset time in days
- **WHEN** resets_at is 2 days from now
- **THEN** display shows "resets in 2d"

#### Scenario: Reset time already passed
- **WHEN** resets_at is in the past
- **THEN** display shows "resets soon"

### Requirement: UsageBar border radius
UsageBar track and fill SHALL use `rounded-sm` (3px) instead of `rounded-full` to match extension styling.

#### Scenario: Bar renders with rounded-sm
- **WHEN** UsageBar renders
- **THEN** track and fill elements use `rounded-sm` class

## ADDED Requirements

### Requirement: Manage usage link in AccountUsageDialog
AccountUsageDialog SHALL display a "Manage usage on claude.ai" button-link in the Quota section when authMethod is `claudeai`.

#### Scenario: Claude AI auth shows manage link
- **WHEN** authMethod is "claudeai"
- **THEN** a "Manage usage on claude.ai" link appears below the quota bars

#### Scenario: Non-claudeai auth hides manage link
- **WHEN** authMethod is "api-key"
- **THEN** no "Manage usage on claude.ai" link appears

#### Scenario: Team/enterprise plan link URL
- **WHEN** subscriptionType is "team" or "enterprise"
- **THEN** the link opens `https://claude.ai/admin-settings/usage`

#### Scenario: Individual plan link URL
- **WHEN** subscriptionType is "pro" or other
- **THEN** the link opens `https://claude.ai/settings/usage`

### Requirement: Unavailable usage message
AccountUsageDialog Quota section SHALL display a message when usage tracking is unavailable (non-claudeai auth).

#### Scenario: Non-claudeai auth shows unavailable message
- **WHEN** authMethod is not "claudeai" and no usage data exists
- **THEN** Quota section shows "Usage tracking is only available for Claude AI subscribers." in italic muted text

#### Scenario: Claude AI auth without data shows loading
- **WHEN** authMethod is "claudeai" and usage is null
- **THEN** Quota section shows "Loading usage data…"

### Requirement: AccountUsageDialog reset time format alignment
AccountUsageDialog's UsageBarRow SHALL use the same `formatResetTime` as UsageBar, prefixed with "Resets " (e.g., "Resets in 3h").

#### Scenario: Dialog usage bar shows relative reset time
- **WHEN** a quota tier has resets_at 2 hours from now
- **THEN** the dialog shows "Resets in 2h"
