## Status: deferred to its own session

This change is intentionally NOT bundled with the live-pill / split-chat /
git-pane-writes batch. Reasons:

1. **Native module risk** — `node-pty` requires platform build tooling that
   the CI environment must validate. Best done with a clean session that can
   focus on `pnpm install` debugging if it fails.
2. **Bundle size** — `xterm` + `xterm-addon-fit` add non-trivial KB to the
   client. Worth measuring before / after.
3. **Multi-tab + persistence policy** — needs separate UX decision: do
   terminal sessions survive page reload? Survive disconnect?
4. **Layout interaction** — vertical `<PanelGroup>` wrapping the existing
   horizontal three-column layout has edge cases with collapsed states.

Proposal stays for reference. Resume by running `/opsx:apply terminal-panel`
in a fresh session.

## When resuming

- [ ] 1. `pnpm add -D -w node-pty` in summoner package; verify Mac + Linux build.
- [ ] 2. Implement TerminalService (Local + Fake) per proposal.
- [ ] 3. Socket handlers + tests with FakeTerminalService.
- [ ] 4. Client: install xterm, build XTermWrapper, TerminalPanel, TerminalContext.
- [ ] 5. Vertical PanelGroup wrap in WorkspaceLayout.
- [ ] 6. Topbar toggle button.
