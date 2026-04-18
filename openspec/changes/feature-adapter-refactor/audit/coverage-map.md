# Feature factory → non-FakeSummoner coverage

| Factory | Coverage test | Status |
|---|---|---|
| attach-file | `features/attach-file/__tests__/attach-file-feature.test.ts` | existing |
| btw | `features/btw/__tests__/btw-feature.test.ts` | existing |
| clear | `features/clear/__tests__/clear-feature.test.ts` | existing |
| color-theme | `features/color-theme/__tests__/color-theme-feature.test.tsx` | existing |
| compact | `features/compact/__tests__/compact-feature.test.ts` | **added in this change** |
| density | `features/density/__tests__/density-feature.test.tsx` | existing |
| effort | `features/effort/__tests__/effort-feature.test.ts` | existing |
| fast-mode | `features/fast-mode/__tests__/fast-mode-feature.test.ts` | existing |
| general-config | `features/general-config/__tests__/general-config-feature.test.ts` | existing |
| manage-plugins | `features/manage-plugins/__tests__/manage-plugins-feature.test.ts` | **added in this change** |
| mcp-servers | `features/mcp-servers/__tests__/mcp-servers-feature.test.ts` | **added in this change** |
| mcp-status | `features/mcp-status/__tests__/mcp-status-feature.test.ts` | existing |
| mention-file | `features/mention-file/__tests__/mention-file-feature.test.ts` | existing |
| model | `features/model/__tests__/model-feature.test.ts` | existing |
| new-conversation | `features/new-conversation/__tests__/new-conversation-feature.test.ts` | existing |
| open-settings | `features/open-settings/__tests__/open-settings-feature.test.ts` | existing |
| reload-plugins | `features/reload-plugins/__tests__/reload-plugins-feature.test.ts` | existing |
| resume | `features/resume/__tests__/resume-feature.test.ts` | existing |
| rewind | `features/rewind/__tests__/rewind-feature.test.ts` | **added in this change** |
| switch-account | `features/switch-account/__tests__/switch-account-feature.test.ts` | existing |
| thinking | `features/thinking/__tests__/thinking-feature.test.ts` | existing |
| usage | `features/usage/__tests__/usage-feature.test.ts` | **added in this change** |
| view-help | `features/view-help/__tests__/view-help-feature.test.ts` | existing |

**Existing**: 18 factories with tests that exercise MenuItemFeature / SlashCommandFeature shape & execute/invoke behavior (non-FakeSummoner).

**Added (5)**: compact, manage-plugins, mcp-servers, rewind, usage. Tests assert current shape + behavior so after refactor we can swap to `Feature` shape without losing safety net.

---

Post-refactor expectation:
- All factory tests must still pass after migration
- Test assertions may need to update from `feature.menuItem.section` → `feature.category` — that's a structural change we allow (not semantic). Scenario unchanged.
