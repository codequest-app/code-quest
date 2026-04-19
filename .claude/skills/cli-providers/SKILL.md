---
name: cli-providers
description: >
  CLI provider capability differences across Claude, Gemini, and other providers. Use when implementing provider-specific logic, discovering CLI behavioral differences, adding new provider support, or encountering limitations where not all CLIs support the same flags.
---

# CLI Provider Differences

When working on CLI integration code (spawning processes, parsing output, building args),
always consult and update the capability matrix below.

## Rules

1. **Check before assuming** — not all providers support the same flags or output formats
2. **Update on discovery** — when you find a new difference, update this file immediately
3. **Provider-agnostic by default** — shared code paths should only use universally supported features
4. **Provider-specific via config** — use the capability matrix to conditionally enable features

## Capability Matrix

See `docs/cli-providers.md` for the full matrix.

## When to Update

- A flag works on one provider but not another
- Output format differs between providers
- A new provider is added
- Stream event types differ
- Permission handling differs

## Checklist

When adding a provider-specific feature:

1. Check `docs/cli-providers.md` for current capabilities
2. Implement with provider branching if needed
3. Update the matrix with any new findings
4. Add tests covering provider-specific behavior
