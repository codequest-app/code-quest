# Spec Delta: client (remove-broken-resume)

## REMOVED Requirements

### Requirement: SessionContext exposes resumeSession action

**Reason:** the underlying `session:resume` broadcast does no real work — it never spawns or reuses a CLI session. Removing prevents callers from depending on a no-op.
**Migration:** none in this change. `chatpanel-resume-via-picker` reintroduces resume via the `SessionPicker` calling `session:launch { resumeSessionId }`.

### Requirement: ProjectContext reacts to session:resume broadcasts

**Reason:** the listener mutated the trailing entry in the sessions array, corrupting project sidebar state. With the broadcast deleted, the listener is unreachable and goes with it.
**Migration:** none. New session creation continues to flow through `session:created` / `session:states`.

### Requirement: ChatPanel renders a resume overlay tied to resumeSession

**Reason:** consumes the deleted `resumeSession` action.
**Migration:** `chatpanel-resume-via-picker` rebuilds the overlay on top of the new `SessionPicker` from `project-menu-resume`.
