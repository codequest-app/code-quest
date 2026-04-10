# Design: Migrate to Shiki

## Current State

CodeBlock 和 FileViewer 使用同步的 `<SyntaxHighlighter>` component：
```tsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
<SyntaxHighlighter style={vscDarkPlus} language={language}>{code}</SyntaxHighlighter>
```

## Target State

使用 `shiki` 的 `codeToHtml` async API，透過 shared highlighter instance：
```tsx
const html = await highlighter.codeToHtml(code, { lang, theme });
<div dangerouslySetInnerHTML={{ __html: html }} />
```

## Key Decisions

1. **Singleton highlighter** — `createHighlighter` 只呼叫一次，lazy init，所有 component 共用
2. **Async rendering** — `codeToHtml` 是 async，component 用 `useState` + `useEffect` 處理 loading state，初次 render 先顯示純文字
3. **Theme** — 使用 `github-dark`（接近現有 vscDarkPlus）
4. **語言 fallback** — shiki 不認識的語言 fallback 成 `text`（純文字），不 crash
5. **Line numbers** — shiki 的 `transformers` API 處理行號，或自己用 CSS
6. **DiffViewer** — 不改，它用 `diff` library 不依賴 syntax highlighter
