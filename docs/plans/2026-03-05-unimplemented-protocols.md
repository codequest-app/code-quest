# Gap Analysis: Protocol Docs vs Implementation

Date: 2026-03-05

## Fully Implemented

- Core chat streaming (text, tool use, tool result, thinking blocks)
- Control requests / control responses
- Session management (create, list, resume, delete)
- MCP server configuration and tool invocation
- Plugins / marketplace CRUD
- Model selection and permission settings
- Usage tracking and stats
- Remote control (CLI remote sessions)
- Diff response rendering
- Tab management
- Auth (login/logout)

## Partially Implemented

- **Cancel request**: AbortController plumbing exists but cancellation signal may not propagate fully to the CLI process
- **Subagent tree**: `parent_tool_use_id` is present in events but the client does not render a nested tree view of subagent tool calls
- **Browser @mentions**: `@browser` mention type is defined in shared types but no browser capture UI exists
- **Task lifecycle UI**: task start/stop events are tracked in the store but there is no dedicated task progress UI component
- **Proactive suggestions trigger**: suggestion generation exists on the server but the client-side trigger heuristics are incomplete

## Not Implemented

- **VSCode Extension commands protocol (§3, §5)**: All VSCode-specific IPC commands (open file, show diff in editor, insert at cursor, etc.) are not implemented — this is VSCode-only and out of scope for the web client
- **Plan comments client UI**: Server-side plan comment storage and socket events exist, but there is no client UI for viewing or adding plan comments
- **Speech-to-text**: No microphone input or transcription integration anywhere in the stack
- **Browser / Chrome MCP integration**: Chrome extension MCP bridge described in protocol docs has no implementation in server or client
