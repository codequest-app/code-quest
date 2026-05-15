## ADDED Requirements

- `App.css` 的 `@theme` block 新增 `--color-border-subtle` token，值為 `color-mix(in srgb, var(--color-border) 50%, transparent)`
- Light theme block 同步新增對應覆寫（若 border 顏色在 light theme 有差異）
- Token 自動產生 `border-border-subtle` utility class，供需要半透明邊框的元件使用
- 現有 `border-border/50` 用法在 chat 區改用 `border-border-subtle`
