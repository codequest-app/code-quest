---
name: pty-architecture
description: PTY-based multi-session architecture for Code Quest. Covers three-layer design, node-pty spawn config, and worktree isolation. Use when implementing or modifying session management, PTY spawning, or terminal integration.
---

# PTY Architecture

## Three-Layer Design

```
React UI (xterm.js) ←→ Socket.IO ←→ Battle Server (node-pty) ←→ Claude CLI
```

- **UI Layer**: xterm.js renders terminal output, Socket.IO for real-time events
- **Server Layer**: BattleBridge manages PTY sessions, OutputParser converts stream-json to events
- **CLI Layer**: Each session = independent PTY process running Claude CLI

## Key Design Decisions

### Why node-pty over child_process.spawn?

| Feature | node-pty | child_process |
|---------|----------|---------------|
| ANSI colors | Full support | Claude disables colors |
| Terminal resize | `pty.resize()` | Not supported |
| Session isolation | Simple per-process | Complex |

### PTY Spawn Config

```typescript
spawn(command, args, {
  name: 'xterm-256color',
  cols: 120, rows: 30,
  cwd: workingDir,
  env: { ...process.env, TERM: 'xterm-256color', FORCE_COLOR: '1', COLORTERM: 'truecolor' }
});
```

### Circular Buffer (10KB)

Output buffer capped at 10KB, sliced to last 5KB on overflow. Prevents memory leaks in long sessions while keeping recent output for late-joining viewers.

### Graceful Shutdown

SIGTERM → wait 5s → SIGKILL. Allows CLI to save state before forced termination.

### Worktree Isolation

Worktree battles use isolated `cwd` paths (e.g., `/worktrees/feature-branch`), preventing concurrent sessions from conflicting on the same working directory.

## Troubleshooting

- **`posix_spawnp failed`**: `chmod +x node_modules/node-pty/build/Release/spawn-helper`
- **No ANSI colors**: Ensure `TERM=xterm-256color` and `FORCE_COLOR=1` in env
- **Zombie process**: Use SIGTERM→SIGKILL pattern with 5s timeout
