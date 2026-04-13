# Spec Delta: command-menu-structure (remove-broken-resume)

## REMOVED Requirements

### Requirement: Menu includes a "Resume conversation" item

**Reason:** the item invoked `onResumeConversation`, which routed to the broken `resumeSession` path. With that path deleted, the entry would dispatch to `undefined`.
**Migration:** `chatpanel-resume-via-picker` re-adds the entry, wired to the new `SessionPicker` dialog.
