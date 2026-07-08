# Lead Hub Deployment

用途：把 AI 銷售天賦問答中心的名單保存部署到 Cloudflare Worker + D1，供官網與未來成交聯盟後台共用。

## 部署前提

- Cloudflare 帳號已登入 Wrangler。
- 不把 `ADMIN_TOKEN`、Cloudflare API token、D1 database id 寫進 GitHub。
- `data/lead-hub-config.json` 在 Worker/D1 驗證前必須保持：

```json
"enabled": false,
"capture_url": ""
```

## 建立 D1

```bash
wrangler d1 create deal-alliance-lead-hub
```

把 Cloudflare 回傳的 `database_id` 填入本機私密的 `worker/wrangler.toml`，不要提交正式 `wrangler.toml`。

可從範本開始：

```bash
cp worker/wrangler.toml.example worker/wrangler.toml
```

`worker/wrangler.toml` 已由 `worker/.gitignore` 排除，不得提交。

## 套用資料表

```bash
wrangler d1 execute deal-alliance-lead-hub --file worker/schema.sql
```

## 設定 Admin Token

產生一組至少 32 字元的 token，設定到 Cloudflare Worker secret：

```bash
wrangler secret put ADMIN_TOKEN
```

## 部署 Worker

```bash
wrangler deploy --config worker/wrangler.toml
```

部署後先測健康檢查：

```bash
curl https://<your-worker>.workers.dev/health
```

## 部署後端到端驗證

使用去識別化測試資料驗證 POST、Admin 查詢與 CSV 匯出：

```bash
LEAD_HUB_URL=https://<your-worker>.workers.dev \
ADMIN_TOKEN=<your-admin-token> \
node 內部工作資料/2026-07-07_AI學員問答中心整合規劃/verify_live_lead_hub_capture.js
```

驗證 PASS 後，才可以更新 `data/lead-hub-config.json`：

```json
"enabled": true,
"capture_url": "https://<your-worker>.workers.dev/lead-events"
```

更新後必須再跑 live E2E，確認公開 AI 問答頁填資料後，後台可查到該筆名單。

## 部署前安全檢查

每次部署或準備啟用 capture 前，先跑：

```bash
node 內部工作資料/2026-07-07_AI學員問答中心整合規劃/verify_lead_hub_deployment_safety.js
```

這會檢查：

- 正式 capture 在批准前仍是關閉。
- `worker/wrangler.toml` 沒有被 Git 追蹤。
- Worker / Admin / config 沒有 hard-coded API key、Admin Token 或 database id。
- Worker 使用 Cloudflare env secret 讀取 `ADMIN_TOKEN`。

## 安全規則

- `ADMIN_TOKEN` 只放 Cloudflare secret 或後台頁暫時輸入，不放 GitHub。
- `worker/wrangler.toml` 若含 database id，預設不提交；只提交 `worker/wrangler.toml.example`。
- 測試資料用 `codex-test+時間戳@example.com`，不使用真實學生資料。
- 啟用 capture 前，必須由使用者明確批准公開頁把學生資料送到該 Worker URL。
