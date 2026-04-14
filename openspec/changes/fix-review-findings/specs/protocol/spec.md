# Spec Delta: protocol (fix-review-findings)

## ADDED Requirements

### Requirement: Per-channel ephemeral state SHALL be cleaned on channel exit

Any Set/Map keyed by channelId that accumulates during a channel's lifetime SHALL be cleared when the channel emits `channel:exit` or `session:closed`. This prevents unbounded growth across sessions.

#### Scenario: interrupted-channels set clears on channel exit

- GIVEN `chat:cancel` has added `channelId` X to `interruptedChannels`
- WHEN channel X emits `channel:exit`
- THEN `interruptedChannels` SHALL NOT contain X

### Requirement: Filesystem cwd-guard SHALL normalize paths before comparison

The local filesystem service SHALL `path.resolve()` the caller-provided `cwd` before any `startsWith` traversal check. Unnormalized paths (trailing slash, relative components) SHALL NOT bypass the guard.

#### Scenario: relative cwd input is normalized

- GIVEN `listFiles` is called with `cwd = '/tmp/'` (trailing slash)
- AND a pattern resolves to `/tmp/allowed.ts`
- THEN the traversal check SHALL accept the path (not reject due to slash mismatch)

#### Scenario: crafted cwd cannot bypass guard

- GIVEN `listFiles` is called with `cwd = '/tmp'`
- AND a crafted absolute path `/tmpfake/evil.ts` is attempted
- THEN the guard SHALL reject (startsWith `/tmp/` not `/tmp` prefix-only)
