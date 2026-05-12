## ADDED Requirements

### Requirement: Highlight 元件只做 syntax highlight

`<Highlight>` 接受 `lang`、`wrap`、`children`，渲染 syntax-highlighted code。不帶 CopyButton。預設自動換行。

#### Scenario: 渲染 bash command
- **WHEN** `<Highlight lang="bash">echo "hello"</Highlight>`
- **THEN** 輸出包含 `language-bash` class 的 highlighted 元素，且無 CopyButton

#### Scenario: 預設自動換行
- **WHEN** `<Highlight lang="bash">` 包含超長單行 command
- **THEN** 文字自動換行（wrapLongLines=true），不出現橫向 scrollbar

#### Scenario: 關閉換行
- **WHEN** `<Highlight lang="bash" wrap={false}>` 
- **THEN** 文字不換行，出現橫向 scrollbar

### Requirement: Copyable 元件加 copy 功能

`<Copyable text={}>` 包裝 children，hover 時顯示 CopyButton。

#### Scenario: hover 顯示 copy
- **WHEN** 滑鼠 hover `<Copyable>` 區域
- **THEN** 右上角出現 CopyButton

#### Scenario: 點擊 copy
- **WHEN** 點擊 CopyButton
- **THEN** `text` prop 內容複製到 clipboard

### Requirement: Labeled 元件加左側 label

`<Labeled label="IN">` 在 children 左側顯示固定寬度的 label。

#### Scenario: 渲染 label
- **WHEN** `<Labeled label="IN">{content}</Labeled>`
- **THEN** 左側顯示 "IN" label，右側顯示 content

### Requirement: 組合後只出現一個 copy button

#### Scenario: Bash tool_use 展開
- **WHEN** BashToolBody 渲染 IN + OUT
- **THEN** IN 區塊只有一個 CopyButton（不會因 Highlight 再出現第二個）

#### Scenario: Markdown 內的 code block
- **WHEN** MarkdownContent 渲染包含 fenced code block 的內容
- **THEN** code block 不出現 CopyButton（由外層 Copyable 負責，如果需要）

### Requirement: Pre 元件純文字呈現

`<Pre>` 渲染 `<pre>` + monospace + whitespace-pre-wrap。

#### Scenario: 渲染 terminal output
- **WHEN** `<Pre>Tests 222 passed</Pre>`
- **THEN** 輸出 `<pre>` 元素，monospace 字型，自動換行
