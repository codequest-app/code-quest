### 7.9 OAuth 認證流程

```
使用者登入
    ↓
Extension 開啟 OAuth 授權 URL
    (https://claude.ai/oauth/authorize 或 https://platform.claude.com/oauth/authorize)
    ↓
使用者同意授權
    ↓
取得 access_token（透過 TOKEN_URL）
    ↓
後續所有 API 請求帶入 Authorization: Bearer <token>
```

---

