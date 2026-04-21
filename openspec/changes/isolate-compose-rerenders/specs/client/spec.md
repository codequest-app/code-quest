## ADDED Requirements

### Requirement: Action-only compose consumers are isolated from typing

Components that subscribe to the channel compose context solely for action callbacks (e.g. `focusTextarea`, `addAttachments`) SHALL NOT re-render when the user types into the compose input. Typing updates `value`, `cursorPos`, and derived typing-state fields; those updates MUST be confined to consumers that actually read those fields.

The compose context MUST expose a dedicated hook, `useChannelComposeActions()`, that subscribes only to the actions context (stable across renders). The existing `useChannelCompose()` hook remains available for consumers that genuinely need both state and actions.

#### Scenario: Sibling consumer using only actions does not re-render on keystrokes

- **WHEN** a `ChannelComposeProvider` wraps a `Typer` component (reads `value` + calls `updateValue`) and a `SiblingSpy` component (calls `useChannelComposeActions()` only)
- **AND** the user types 5 characters into the `Typer`
- **THEN** `SiblingSpy` is rendered exactly once (at mount) and does not re-render for any keystroke

#### Scenario: `useChannelCompose()` continues to work for full-context consumers

- **WHEN** a component calls `useChannelCompose()` and reads `value` or `hasText`
- **THEN** the component receives the current state and re-renders on typing as before

### Requirement: Compose actions object is referentially stable

The object returned by `useChannelComposeActions()` MUST preserve reference identity across re-renders of `ChannelComposeProvider`. Inline function properties such as `registerFocus` and `registerMentionTrigger` MUST be constructed once (e.g. via `useState` initializer) rather than re-allocated per render.

#### Scenario: Actions reference is stable across provider re-renders

- **WHEN** `ChannelComposeProvider` re-renders due to a state change
- **THEN** the actions object exposed via `ComposeActionsContext` is the same reference as before the state change
