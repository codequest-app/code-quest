# Layout RWD Refactor

## Background

Playwright layout dump (mobile/tablet/desktop) revealed redundant CSS classes in the flex layout chain. These were exposed after the ChatInput was moved from absolute positioning to in-flow (`shrink-0`), making the full layout chain reviewable.

## Issues Found

### 1. EditorArea — redundant `h-full`
```
flex flex-col flex-1 h-full
```
`flex-1` already fills the available height when the parent is `flex`. `h-full` is redundant.

### 2. Tab content wrapper — leftover `relative`
```
flex flex-1 overflow-hidden relative
```
`relative` was leftover from when absolutely-positioned children existed. Now that ChatInput is in-flow, nothing uses this positioning context.

### 3. ChatPanel root — `h-full w-full` redundant
```
flex h-full w-full overflow-hidden
```
In a flex parent, `h-full` and `w-full` are redundant when `flex-1 min-w-0` is already provided by the container. Should be `flex flex-1 overflow-hidden min-w-0`.

### 4. Projects container — `h-full` redundant + inconsistent ordering
```
flex-1 min-w-0 flex h-full
```
`h-full` is redundant (flex parent already stretches children). Class ordering inconsistent — `flex` should come before utility classes.

## Goal

Remove all redundant layout classes without changing visual behavior. All existing layout tests must pass unchanged.
