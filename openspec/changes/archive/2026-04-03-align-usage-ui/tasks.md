## 1. Shared util: formatResetTime

- [x] 1.1 Extract `formatResetTime` from AccountUsageDialog to a shared util (e.g., `packages/client/src/utils/format-reset-time.ts`), update both components to import from it
- [x] 1.2 Update UsageBar to use `formatResetTime` (relative format: `in Xm/Xh/Xd`) instead of `toLocaleTimeString`

## 2. UsageBar styling alignment

- [x] 2.1 Change UsageBar color logic from three-state (success/warning/danger) to two-state (accent/danger at 80%) — update `tierColor` function
- [x] 2.2 Change UsageBar track and fill border radius from `rounded-full` to `rounded-sm`
- [x] 2.3 Update UsageBar tests: remove `bg-success`/`bg-warning` assertions, assert `bg-accent` for <80% and `bg-danger` for >=80%

## 3. AccountUsageDialog enhancements

- [x] 3.1 Add "Manage usage on claude.ai" link in Quota section (visible when authMethod === 'claudeai'), URL varies by subscriptionType
- [x] 3.2 Add unavailableReason display: show italic muted message when authMethod is not 'claudeai' and no usage data
- [x] 3.3 Update AccountUsageDialog Quota section to show "Loading usage data…" only when authMethod is 'claudeai' and usage is null
- [x] 3.4 Add tests for manage link visibility, URL by plan type, and unavailable message

## 4. Stories update

- [x] 4.1 Update UsageBar stories to reflect new two-state coloring
- [x] 4.2 Update AccountUsageDialog stories to include manage link and unavailable state variants
