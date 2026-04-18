## ADDED Requirements

### Requirement: App root applies preferences on mount

`App.tsx` SHALL 在 root component 掛載時從 `usePreferencesStore` 讀取 `colorTheme` / `fontSize` / `density`，並以 `useEffect` 寫入 `document.documentElement.dataset`。訂閱 store 變動，當偏好改變時同步更新 dataset。

#### Scenario: Attributes present on initial render

- **WHEN** `<App />` 掛載
- **THEN** `document.documentElement.getAttribute('data-theme')` 回傳當前 store 的 `colorTheme`
- **AND** `data-font` / `data-density` 同樣已設定

#### Scenario: Attributes update on preference change

- **WHEN** 其他元件呼叫 `setFontSize('lg')`
- **THEN** `document.documentElement.dataset.font` 變為 `'lg'`，毋須 component re-render 亦可生效
