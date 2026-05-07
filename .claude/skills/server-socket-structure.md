---
description: Server socket package structure and conventions. Use when adding new handlers, modifying socket events, or working with provider-specific (Claude/Gemini) code.
---

# Server Socket Structure

```
apps/server/src/socket/
├── types.ts                     # TypedSocket, TypedServer, errMsg, ensureChannel
├── context.ts                   # HandlerContext interface (generic, no provider state)
├── server.ts                    # SocketServer class (DI + handler registration + buildChannelHooks)
├── channel.ts                   # Channel class (per-session runner state + control requests)
├── channel-manager.ts           # ChannelManager (channel lifecycle + raw event persistence)
│
├── handlers/                    # Generic handlers (work with any CLI provider)
│   ├── connection.ts            # app:init, app:config, disconnect
│   ├── session/
│   │   ├── index.ts             # barrel: registers lifecycle + fork + management events
│   │   ├── management.ts        # session:list, delete, rename, get, generate_title, update_state
│   │   ├── lifecycle.ts         # session:launch, join, close, resume + persistNewSession
│   │   └── fork.ts              # session:fork, teleport
│   ├── message.ts               # chat:send, cancel, respond, stop_task, cancel_async, rewind_code, cancel_request, hook_respond
│   ├── settings.ts              # settings:* events
│   ├── file.ts                  # file:read, file:list
│   ├── git.ts                   # git:* events
│   ├── terminal.ts              # terminal:* events
│   ├── mcp.ts                   # generic MCP operations (reconnect, toggle, servers, message, auth)
│   ├── plan.ts                  # plan:* events
│   ├── speech.ts                # speech:* events
│   ├── exec-git.ts              # execGit utility (separate for test spy compat)
│   └── rg.ts                    # ripgrep availability + file listing
│
└── claude/                      # Claude CLI-specific
    ├── auth.ts                  # auth:status, login, oauth_code
    ├── plugin.ts                # plugin:* events + runPluginCommand
    ├── mcp-servers.ts           # mcp:ensure_chrome, disable_chrome, enable_jupyter, disable_jupyter
    ├── cli.ts                   # runPluginCommand, runPluginCommandAsync
    └── state.ts                 # claudeState singleton (chromeMcpState, pluginCache)
```

## Adding a New Handler

1. Create `handlers/<name>.ts` with `export function register(socket, ctx)`
2. Add import + call in `server.ts` handleConnection()
3. If Claude-specific, put in `claude/` instead

## Adding a New Provider (e.g., Gemini)

1. Create `gemini/` directory alongside `claude/`
2. Move provider-specific handlers there
3. Generic handlers in `handlers/` work with any provider
4. Provider state goes in `gemini/state.ts` (not HandlerContext)

## Key Conventions

- Handler files don't have `-handler` suffix (directory says it)
- HandlerContext has NO provider-specific state
- Provider state uses module-level singletons in `<provider>/state.ts`
- Utility modules (exec-git.ts, rg.ts) are separate files for vi.spyOn compatibility
- `session/` has its own barrel index.ts because it spans 3 files
